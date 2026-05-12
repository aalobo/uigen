import { describe, test, expect } from "vitest";
import { getToolLabel } from "@/lib/tool-labels";

describe("getToolLabel", () => {
  test("str_replace_editor create with path", () => {
    expect(
      getToolLabel("str_replace_editor", { command: "create", path: "/App.jsx" }).label
    ).toBe("Création de /App.jsx");
  });

  test("str_replace_editor str_replace with path", () => {
    expect(
      getToolLabel("str_replace_editor", { command: "str_replace", path: "/App.jsx" }).label
    ).toBe("Modification de /App.jsx");
  });

  test("str_replace_editor view with path", () => {
    expect(
      getToolLabel("str_replace_editor", { command: "view", path: "/App.jsx" }).label
    ).toBe("Lecture de /App.jsx");
  });

  test("str_replace_editor insert with path", () => {
    expect(
      getToolLabel("str_replace_editor", { command: "insert", path: "/App.jsx" }).label
    ).toBe("Insertion dans /App.jsx");
  });

  test("file_manager rename with both paths", () => {
    expect(
      getToolLabel("file_manager", {
        command: "rename",
        path: "/App.jsx",
        new_path: "/Main.jsx",
      }).label
    ).toBe("Renommage de /App.jsx → /Main.jsx");
  });

  test("file_manager delete with path", () => {
    expect(
      getToolLabel("file_manager", { command: "delete", path: "/App.jsx" }).label
    ).toBe("Suppression de /App.jsx");
  });

  test("falls back to generic label when args are empty", () => {
    expect(getToolLabel("str_replace_editor", {}).label).toBe("Édition de fichier");
    expect(getToolLabel("file_manager", {}).label).toBe("Gestion de fichier");
  });

  test("falls back to tool name for unknown tools", () => {
    expect(getToolLabel("mystery_tool", { command: "foo" }).label).toBe(
      "mystery_tool"
    );
  });
});
