
# PathFinder: Interactive RRT & RRT* Visualizer

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3.0-38B2AC.svg?logo=tailwindcss)

An advanced, interactive educational tool designed to visualize and explain **Rapidly-exploring Random Trees (RRT)** and its optimal variant, **RRT***. Built for students, roboticists, and algorithm enthusiasts to understand path planning in high-dimensional spaces.

<div align="center">
  <!-- PLACEHOLDER: Main Demo Video (GIF or MP4) -->
  <!-- Recommended size: 800x450px -->
[![Demo Video](https://img.youtube.com/vi/KkEAe3gj2Zg/maxresdefault.jpg)](https://youtu.be/KkEAe3gj2Zg)
  <p><em>Real-time visualization of RRT* finding an optimal path through a maze.</em></p>
</div>

---

## 🌟 Key Features

### 🧠 Algorithm Visualization
- **RRT (Rapidly-exploring Random Trees)**: Watch the tree grow aggressively into free space. Great for fast, non-optimal solutions.
- **RRT* (Optimal RRT)**: Observe the "rewiring" process in real-time as the algorithm refines the path, shortening the distance to the goal dynamically.

### 💻 Step-by-Step Code Execution
A dedicated **Code Trace Window** maps the visual canvas actions directly to the algorithm's pseudocode.
- **Micro-Stepping**: Pause the simulation and step through individual lines of logic (Sample -> Nearest -> Steer -> Collision Check).
- **Rich Commentary**: Each line of code is accompanied by an extensive, educational comment explaining *why* that step is happening.

### 🎮 Interactive Sandbox
- **Dynamic Obstacles**: Left-click and drag on the canvas to draw custom walls and barriers.
- **Movable Points**: Drag the **Start (Blue)** and **Goal (Red)** nodes anywhere in real-time.
- **Presets**: Load pre-built maps like "Narrow Passage" or "Random Maze" to test edge cases.

### 🤖 AI-Powered Explanations
Integrated with **Google Gemini API**:
- Ask the AI to explain specific concepts like "Probabilistic Completeness" or "Rewiring Radius" directly within the app.
- Context-aware answers tailored for robotics path planning.

---

## 📸 Screenshots

| **Main Interface** | **Code Trace Mode** |
|:---:|:---:|
| <!-- PLACEHOLDER: Screenshot of the main canvas with RRT tree --> <img src="docs/screen_main.png" alt="Main Interface" width="400"/> | <!-- PLACEHOLDER: Screenshot of the Code Viewer open with highlighted line --> <img src="docs/screen_code.png" alt="Code Execution Step" width="400"/> |
| *Visualize complex tree structures in real-time.* | *Follow the algorithm logic line-by-line.* |

| **RRT* Optimization** | **Interactive Editing** |
|:---:|:---:|
| <!-- PLACEHOLDER: Screenshot showing the green path straightening out --> <img src="docs/screen_rrtstar.png" alt="RRT Star Optimization" width="400"/> | <!-- PLACEHOLDER: Screenshot of drawing an obstacle with mouse --> <img src="docs/screen_draw.png" alt="Drawing Obstacles" width="400"/> |
| *See the path straighten as RRT* rewires nodes.* | *Draw custom scenarios to challenge the solver.* |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/pathfinder-visualizer.git
   cd pathfinder-visualizer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment (Optional for AI features)**
   To use the AI explanation feature, you need a Google Gemini API key.
   - Create a file named `.env` in the root directory.
   - Add your key:
     ```env
     REACT_APP_GEMINI_API_KEY=your_api_key_here
     ```
   *(Note: The visualizer works fully without the API key; only the "Ask AI" button will be disabled.)*

4. **Run the application**
   ```bash
   npm start
   ```
   Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

---

## 🎮 Controls & Usage

| Action | Control |
| :--- | :--- |
| **Move Start/Goal** | **Left Drag** the Blue (S) or Red (G) circles. |
| **Draw Obstacle** | **Left Drag** on empty space to create a rectangular wall. |
| **Remove Obstacle** | **Right Click** on an existing obstacle. |
| **Play / Pause** | Toggle simulation running state. |
| **Step** | Advance the simulation by one iteration (or one line of code if Code View is open). |
| **Show Code** | Toggle the floating window to see the algorithm internals. |

---

## 🛠️ Technologies Used

- **React 19**: Core UI framework for state management and rendering.
- **TypeScript**: For type-safe code and robust data structures (Nodes, Points).
- **HTML5 Canvas API**: High-performance rendering of thousands of tree nodes and edges.
- **Tailwind CSS**: Modern, responsive styling with a dark-mode aesthetic.
- **Lucide React**: Beautiful, consistent iconography.
- **Google GenAI SDK**: Powering the in-app educational chatbot.

---

## 📚 Algorithm Primer

### RRT (Rapidly-exploring Random Tree)
RRT is designed to efficiently search high-dimensional spaces by randomly building a space-filling tree.
1. **Sample**: Pick a random point in space.
2. **Nearest**: Find the closest node in the existing tree.
3. **Steer**: Move from the nearest node toward the sample by a fixed step size.
4. **Extend**: If no collision, add the new node.

### RRT* (Optimal RRT)
RRT* adds an optimization step to standard RRT, ensuring that as the number of nodes approaches infinity, the path found approaches the optimal (shortest) solution.
1. **Near Neighbors**: After generating a new node, look at all neighbors within a radius.
2. **Choose Parent**: Connect the new node to the neighbor that gives the lowest total cost from the start.
3. **Rewire**: Check if the new node can provide a cheaper path to its neighbors. If so, update their parent to be the new node.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Inspired by the seminal paper on RRTs by Steven M. LaValle.
- RRT* algorithm developed by Sertac Karaman and Emilio Frazzoli.
