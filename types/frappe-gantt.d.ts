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
    // frappe parses these onto the task at render time.
    _start?: Date;
    _end?: Date;
    // Streamline extensions: `_progressLabel` is the true completion % shown in
    // the popup (the visible `progress` is repurposed for the two-tone overdue
    // bar), and `_clampToToday` flags bars whose right edge is snapped to the
    // today marker after render.
    _progressLabel?: number;
    _clampToToday?: boolean;
  }

  export interface FrappePopupContext {
    task: FrappeTask;
    chart: Gantt;
    get_title: () => HTMLElement;
    set_title: (html: string) => void;
    get_subtitle: () => HTMLElement;
    set_subtitle: (html: string) => void;
    get_details: () => HTMLElement;
    set_details: (html: string) => void;
  }

  export interface FrappeOptions {
    view_mode?: string;
    readonly?: boolean;
    popup_on?: "click" | "hover";
    on_click?: (task: FrappeTask) => void;
    today_button?: boolean;
    infinite_padding?: boolean;
    popup?: (ctx: FrappePopupContext) => void | string;
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
