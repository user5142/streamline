// Minimal type declarations for frappe-gantt 1.2.x (no types are bundled).
declare module "frappe-gantt" {
  export interface FrappeTask {
    id: string;
    name: string;
    start: string;
    end: string;
    progress?: number;
    dependencies?: string;
    custom_class?: string;
    description?: string;
  }

  export interface FrappeOptions {
    view_mode?: string;
    readonly?: boolean;
    popup_on?: "click" | "hover";
    on_click?: (task: FrappeTask) => void;
    today_button?: boolean;
    [key: string]: unknown;
  }

  export default class Gantt {
    constructor(
      wrapper: string | HTMLElement | SVGElement,
      tasks: FrappeTask[],
      options?: FrappeOptions
    );
    refresh(tasks: FrappeTask[]): void;
    change_view_mode(mode?: string): void;
  }
}

declare module "frappe-gantt/dist/frappe-gantt.css";
