export class StageItemObject {
  public x: number;
  public y: number;
  public radius: number;
  public item: StageItem;
  public isHovered: boolean;

  constructor(
    item: StageItem,
    x: number = 0,
    y: number = 0,
    radius: number = 10
  ) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.item = item;
    this.isHovered = false;
  }

  public render(context: CanvasRenderingContext2D) {
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    context.fillStyle = this.isHovered ? "#81d0f0" : "#02A0E1"; // Change color if hovered
    context.fill();
  }

  hitTest(x: number, y: number): StageItemObject | null {
    const dx = x - this.x;
    const dy = y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= this.radius) {
      return this;
    }
    return null;
  }
}

export class StageItem {
  x: number;
  y: number;
  isDragging: boolean;
  mainItem: StageItemObject;
  inputItem: StageItemObject;
  outputItem: StageItemObject;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.isDragging = false;

    this.inputItem = new StageItemObject(this, 0, 0, 20);
    this.outputItem = new StageItemObject(this, 0, 0, 20);
    this.mainItem = new StageItemObject(this, 0, 0, 50);
  }

  hitTest(x: number, y: number): boolean {
    const items = [this.mainItem, this.inputItem, this.outputItem];
    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      if (item.hitTest(x, y)) {
        return true;
      }
    }
    return false;
  }

  render(context: CanvasRenderingContext2D): void {
    this.inputItem.x = this.x - 50;
    this.inputItem.y = this.y;
    this.inputItem.render(context);

    this.outputItem.x = this.x + 50;
    this.outputItem.y = this.y;
    this.outputItem.render(context);

    this.mainItem.x = this.x;
    this.mainItem.y = this.y;
    this.mainItem.render(context);
  }
}

type Connection = {
  start: StageItemObject;
  end: StageItemObject;
};

export class Stage {
  private parentElement: HTMLElement;
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private items: StageItem[];
  private connections: Connection[];
  private currentItem: StageItem | null;
  private offsetX: number;
  private offsetY: number;
  private isConnecting: boolean;
  private startConnector: StageItemObject | null;
  private endConnector: StageItemObject | null;
  private scale: number;
  private panX: number;
  private panY: number;
  private isPanning: boolean;

  constructor(parentElement: HTMLElement) {
    this.parentElement = parentElement;
    this.canvas = document.createElement("canvas");
    this.context = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    this.items = [];
    this.connections = [];
    this.currentItem = null;
    this.offsetX = 0;
    this.offsetY = 0;
    this.isConnecting = false;
    this.startConnector = null;
    this.endConnector = null;
    this.scale = 1;
    this.panX = 0;
    this.panY = 0;
    this.isPanning = false;

    this.parentElement.appendChild(this.canvas);
    this.createZoomSlider();
    this.updateCanvasSize();

    window.addEventListener("resize", () => this.updateCanvasSize());

    this.canvas.addEventListener("mousedown", this.onMouseDown.bind(this));
    this.canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
    this.canvas.addEventListener("mouseup", this.onMouseUp.bind(this));
    this.canvas.addEventListener("dblclick", this.onDoubleClick.bind(this));
  }

  private createZoomSlider(): void {
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0.5";
    slider.max = "2";
    slider.step = "0.01";
    slider.value = "1";
    slider.style.position = "absolute";
    slider.style.bottom = "10px";
    slider.style.left = "10px";
    this.parentElement.appendChild(slider);

    slider.addEventListener("input", (event) => {
      this.scale = parseFloat((event.target as HTMLInputElement).value);
      this.render();
    });
  }

  private updateCanvasSize(): void {
    this.canvas.width = this.parentElement.clientWidth;
    this.canvas.height = this.parentElement.clientHeight;
    this.render();
  }

  add(item: StageItem): void {
    this.items.push(item);
    this.render();
  }

  private render(): void {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.save();
    this.context.translate(this.panX, this.panY);
    this.context.scale(this.scale, this.scale);

    // Render connections
    this.connections.forEach((connection) => {
      this.context.beginPath();
      this.context.setLineDash([]);
      this.context.moveTo(connection.start.x, connection.start.y);
      this.context.lineTo(connection.end.x, connection.end.y);
      this.context.stroke();
    });

    // Render current connecting line
    if (this.isConnecting && this.startConnector) {
      this.context.beginPath();
      this.context.setLineDash([5, 5]);
      this.context.moveTo(this.startConnector.x, this.startConnector.y);
      this.context.lineTo(
        (this.offsetX - this.panX) / this.scale,
        (this.offsetY - this.panY) / this.scale
      );
      this.context.stroke();
      this.context.setLineDash([]);
    }

    this.items.forEach((item) => item.render(this.context));

    this.context.restore();
  }

  private onMouseDown(event: MouseEvent): void {
    const mousePos = this.getMousePos(event);
    this.currentItem =
      this.items.find((item) => this.isMouseOnItem(mousePos, item)) || null;

    if (this.currentItem) {
      const startConnector = this.currentItem.inputItem.hitTest(
        mousePos.x,
        mousePos.y
      )
        ? this.currentItem.inputItem
        : this.currentItem.outputItem.hitTest(mousePos.x, mousePos.y)
        ? this.currentItem.outputItem
        : null;

      if (startConnector) {
        this.isConnecting = true;
        this.startConnector = startConnector;
        this.offsetX = mousePos.x;
        this.offsetY = mousePos.y;
      } else {
        this.currentItem.isDragging = true;
        this.offsetX = (mousePos.x - this.currentItem.x) * this.scale;
        this.offsetY = (mousePos.y - this.currentItem.y) * this.scale;
      }
    } else {
      this.isPanning = true;
      this.offsetX = event.clientX;
      this.offsetY = event.clientY;
    }
  }

  private onMouseMove(event: MouseEvent): void {
    const mousePos = this.getMousePos(event);

    // Update hover state for main items
    this.items.forEach((item) => {
      item.mainItem.isHovered = !!item.mainItem.hitTest(mousePos.x, mousePos.y);
    });

    if (this.isConnecting) {
      this.offsetX = event.clientX;
      this.offsetY = event.clientY;
      this.render();
    } else if (this.currentItem && this.currentItem.isDragging) {
      this.currentItem.x = mousePos.x - this.offsetX / this.scale;
      this.currentItem.y = mousePos.y - this.offsetY / this.scale;
      this.render();
    } else if (this.isPanning) {
      const dx = event.clientX - this.offsetX;
      const dy = event.clientY - this.offsetY;
      this.panX += dx;
      this.panY += dy;
      this.offsetX = event.clientX;
      this.offsetY = event.clientY;
      this.render();
    } else {
      this.render();
    }
  }

  private onMouseUp(event: MouseEvent): void {
    const mousePos = this.getMousePos(event);

    if (this.isConnecting) {
      const targetItem =
        this.items.find((item) => this.isMouseOnItem(mousePos, item)) || null;

      if (targetItem) {
        const endConnector = targetItem.inputItem.hitTest(
          mousePos.x,
          mousePos.y
        )
          ? targetItem.inputItem
          : targetItem.outputItem.hitTest(mousePos.x, mousePos.y)
          ? targetItem.outputItem
          : null;

        if (endConnector) {
          this.endConnector = endConnector;
          this.connections.push({
            start: this.startConnector!,
            end: this.endConnector,
          });
        }
      }

      this.isConnecting = false;
      this.render();
    } else if (this.currentItem) {
      this.currentItem.isDragging = false;
      this.currentItem = null;
    } else if (this.isPanning) {
      this.isPanning = false;
    }
  }

  private onDoubleClick(event: MouseEvent): void {
    const mousePos = this.getMousePos(event);
    const clickedItem =
      this.items.find((item) => this.isMouseOnItem(mousePos, item)) || null;

    if (clickedItem && clickedItem.mainItem.hitTest(mousePos.x, mousePos.y)) {
      alert("Double-clicked on main item!");
      // Additional double-click logic here
    }
  }

  private getMousePos(event: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left - this.panX) / this.scale,
      y: (event.clientY - rect.top - this.panY) / this.scale,
    };
  }

  private isMouseOnItem(
    mousePos: { x: number; y: number },
    item: StageItem
  ): boolean {
    return item.hitTest(mousePos.x, mousePos.y) || false;
  }
}
