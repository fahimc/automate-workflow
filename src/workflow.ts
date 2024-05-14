import { Stage, StageItem } from "./stage";

export class Workflow {
  private stage: Stage;
  private toolbar: HTMLElement;
  private parentElement: HTMLElement;
  constructor(parentElement: HTMLElement) {
    this.stage = new Stage(parentElement);
    this.toolbar = document.createElement("div");
    this.parentElement = parentElement;
    this.renderToolbar();
  }
  renderToolbar(): void {
    this.toolbar.innerHTML = `
      <button id="add-item">Add Item</button>
    `;
    this.toolbar.classList.add("toolbar");
    this.toolbar.querySelector("#add-item")?.addEventListener("click", () => {
      const item1 = new StageItem(50, 50);
      this.stage.add(item1);
    });

    this.parentElement.appendChild(this.toolbar);
  }
}
