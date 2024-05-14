import "./style.css";
import typescriptLogo from "./typescript.svg";
import viteLogo from "/vite.svg";
import { setupCounter } from "./counter.ts";
import { Stage, StageItem } from "./stage.ts";
import { Workflow } from "./workflow.ts";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div id="stage-container">
  </div>
`;

// Usage example:
const parentElement = document.getElementById("stage-container") as HTMLElement;
const workflow = new Workflow(parentElement);
