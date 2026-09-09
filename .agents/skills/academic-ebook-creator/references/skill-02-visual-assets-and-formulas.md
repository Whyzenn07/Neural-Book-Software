# SKILL 02: Visual Asset & KaTeX Formula Preservation (With Strict Anti-Error Safeguards)

This module governs the extraction, positioning, rendering, and strict syntax validation of visual exhibits, charts, mathematical equations, and structured data tables.

---

## 1. Mathematical Equations & KaTeX Syntax Standards

### ⚠️ Strict Delimiter Balancing & Anti-Error Mandates

KaTeX renders mathematical equations inside Markdown. When delimiters are missing, unbalanced, or misplaced, **KaTeX fails and renders raw LaTeX commands as ugly red error text**.

#### The 5 Golden KaTeX Rules:
1. **Strict Delimiter Symmetry**:
   - Every opening `$` MUST have a corresponding closing `$` on the same line: `$a^2 + b^2 = c^2$`.
   - Every block display opening `$$` MUST have a matching closing `$$`:
     ```latex
     $$
     PV = \frac{FV}{(1 + r)^n}
     $$
     ```
   - **NEVER** leave a lone dangling `$`, such as `$= 10,000` or `25,000$;`.
2. **Zero Naked LaTeX Macros**:
   - Macros such as `\times`, `\dfrac`, `\frac`, `\text{...}`, `\sqrt`, `\alpha`, `\beta`, `{,}` can ONLY exist inside math delimiters (`$` or `$$`).
   - If you need multiplication `\times`, the entire expression MUST be inside math mode: `$5 \times 10 = 50$`.
3. **Clean Separation of Text vs. Math**:
   - Keep variable names and regular words either outside `$ ... $` as plain text, or wrapped in `\text{...}` inside math delimiters.
   - Example (Plain text outside): `New Profit After Tax $= 50{,}000 + 25{,}000 = 75{,}000$`
   - Example (Inside math): `$\text{New Profit After Tax} = 50{,}000 + 25{,}000 = 75{,}000$`
4. **Number Formatting & Thousands Separators**:
   - Plain text numbers: Write standard digits with regular commas (`50,000` or `5,00,000`).
   - Math mode numbers: You may use `{,}` to remove math-spacing after commas (`$50{,}000$`), but **NEVER** write `{,}` in plain text without `$`.
5. **Currency and Units**:
   - Use `\text{Rs } 75{,}000` or `\text{USD } 50{,}000` inside math mode.
   - Escape literal dollar signs in plain text (`\$50,000`) so markdown parsers do not accidentally start a math block!

---

### Direct Anti-Error Comparison Table

| Problematic Syntax (Produces Red Error) | Root Cause of Failure | Correct Syntax (Flawless Render) |
| :--- | :--- | :--- |
| `Substitution: New profit after tax = 50{,}000 + (5{,}00{,}000 \times 0.05) = 50{,}000 + 25{,}000$; new share count $= 10{,}000 + 10{,}000` | Unopened math mode, dangling `$` after `25{,}000`, naked `\times`, unclosed `$=` | `- **Substitution**:<br/>  - New profit after tax $= 50{,}000 + (5{,}00{,}000 \times 0.05) = 50{,}000 + 25{,}000$<br/>  - New share count $= 10{,}000 + 10{,}000$` |
| `Calculation: New profit after tax = \text{Rs } 75{,}000$; New EPS $= \dfrac{75{,}000}{20{,}000} = \text{Rs } 3.75` | Missing opening `$`, naked `\text{Rs }`, unclosed `$= \dfrac...` | `- **Calculation**:<br/>  - New profit after tax $= \text{Rs } 75{,}000$<br/>  - $\text{New EPS} = \dfrac{75{,}000}{20{,}000} = \text{Rs } 3.75$` |
| `The cost is 50{,}000 with formula \frac{a}{b}` | Naked `{,}` and `\frac` in plain text | `The cost is 50,000 with formula $\frac{a}{b}$.` |

---

## 2. Standard 5-Step Worked Examples Format

Complex formula explanations must follow the 5-step sequence with strict KaTeX syntax:

```markdown
#### Example 1.1: Expansion Impact on Earnings Per Share (EPS)

- **Given**:
  - Existing profit after tax $= \text{Rs } 50{,}000$
  - New capital to be raised $= \text{Rs } 5{,}00{,}000$
  - Expected return on new capital $= 5\% = 0.05$
  - Existing number of shares $= 10{,}000$
  - Additional equity shares issued $= 10{,}000$

- **Formula**:
  $$ \text{New Profit After Tax} = \text{Existing Profit} + (\text{New Capital} \times \text{Return Rate}) $$
  $$ \text{New EPS} = \frac{\text{New Profit After Tax}}{\text{Total Number of Shares}} $$

- **Substitution**:
  - New profit after tax $= 50{,}000 + (5{,}00{,}000 \times 0.05) = 50{,}000 + 25{,}000$
  - Total share count $= 10{,}000 + 10{,}000 = 20{,}000$

- **Calculation**:
  - New profit after tax $= \text{Rs } 75{,}000$
  - $\text{New EPS} = \dfrac{75{,}000}{20{,}000} = \text{Rs } 3.75$

- **Interpretation**:
  The new project yields an additional profit of $\text{Rs } 25{,}000$. Total profit reaches $\text{Rs } 75{,}000$, resulting in an EPS of $\text{Rs } 3.75$ per share.
```

---

## 3. Mandatory Symbol Key Table

Every major theoretical equation must be accompanied by a structured Symbol Key Table:

$$ \sigma(z) = \frac{1}{1 + e^{-z}} $$

| Symbol | Meaning | Unit / Dimension |
| :--- | :--- | :--- |
| $\sigma(z)$ | Sigmoid activation output | Dimensionless $[0, 1]$ |
| $z$ | Weighted linear input vector | Real number ($\mathbb{R}$) |
| $e$ | Euler's constant ($\approx 2.71828$) | Mathematical constant |

---

## 4. Visual Exhibits & Diagrams

1. **Auto-Cropping & Extraction**:
   - Extract high-resolution cropped bounding boxes for all diagrams, flowcharts, schematics, and figures.
   - Save assets under standard naming: `images/page_{page_num}_exhibit_{idx}.png`.
2. **Display Alignment & Standard Captions**:
   - Every figure/diagram must be centered with a bold title caption below:
     ```html
     <div align="center">
       <img src="images/page_012_exhibit_1.png" alt="System Architecture Diagram" style="max-width: 90%; border-radius: 4px;" />
       <br/>
       <b>Exhibit 2.1: Distributed Neural System Architecture</b>
     </div>
     ```

---

## 5. Structured Markdown Pipe-Tables

- **Never** flatten tables into plain text sentences.
- Always generate properly formatted Markdown pipe-tables with explicit alignment indicators (`:---`, `:---:`, `---:`):
  ```markdown
  | Layer Type | Input Shape | Output Shape | Parameters |
  | :--- | :---: | :---: | ---: |
  | Dense_1 | `(None, 784)` | `(None, 128)` | 100,480 |
  | Dense_2 | `(None, 128)` | `(None, 10)` | 1,290 |
  ```
