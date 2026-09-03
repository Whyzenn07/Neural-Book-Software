# SKILL 02: Visual Asset & Formula Preserver

This module governs the extraction, positioning, rendering, and validation of visual exhibits, charts, mathematical equations, and structured data tables.

## 1. Visual Exhibits & Diagrams

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

## 2. Mathematical Equations & Formulas

1. **Formula Display Standard**:
   - Block display equations must be centered using standard KaTeX/LaTeX syntax:
     ```latex
     $$ \sigma(z) = \frac{1}{1 + e^{-z}} $$
     ```
2. **Symbol Key Table**:
   - Every major equation must immediately be accompanied by a Symbol Key Table:
     | Symbol | Meaning | Unit / Dimension |
     | :--- | :--- | :--- |
     | $\sigma(z)$ | Sigmoid activation output | Dimensionless $[0, 1]$ |
     | $z$ | Weighted linear input vector | Real number ($\mathbb{R}$) |
     | $e$ | Euler's constant ($\approx 2.71828$) | Constant |

3. **Worked Examples Format**:
   - Complex formula explanations must follow the 5-step worked example sequence:
     - **Given**: Known input values and constraints.
     - **Formula**: The exact formula used.
     - **Substitution**: Variable values plugged into the equation.
     - **Calculation**: Step-by-step arithmetic/algebraic evaluation.
     - **Interpretation**: Real-world/domain meaning of the result.

## 3. Data Tables

- **Never** flatten tables into plain text sentences.
- Always generate properly formatted Markdown pipe-tables with explicit alignment indicators (`:---`, `:---:`, `---:`):
  ```markdown
  | Layer Type | Input Shape | Output Shape | Parameters |
  | :--- | :---: | :---: | ---: |
  | Dense_1 | `(None, 784)` | `(None, 128)` | 100,480 |
  | Dense_2 | `(None, 128)` | `(None, 10)` | 1,290 |
  ```
