import {
  FilePlus2,
  FilePen,
  FileSearch,
  Trash2,
  Replace,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export interface ToolLabel {
  label: string;
  Icon: LucideIcon;
}

export function getToolLabel(toolName: string, args: any): ToolLabel {
  const path = args?.path;
  const command = args?.command;

  if (toolName === "str_replace_editor") {
    switch (command) {
      case "create":
        return {
          label: path ? `Création de ${path}` : "Création de fichier",
          Icon: FilePlus2,
        };
      case "str_replace":
        return {
          label: path ? `Modification de ${path}` : "Modification de fichier",
          Icon: FilePen,
        };
      case "insert":
        return {
          label: path ? `Insertion dans ${path}` : "Insertion dans fichier",
          Icon: FilePen,
        };
      case "view":
        return {
          label: path ? `Lecture de ${path}` : "Lecture de fichier",
          Icon: FileSearch,
        };
      case "undo_edit":
        return {
          label: path ? `Annulation sur ${path}` : "Annulation",
          Icon: FilePen,
        };
      default:
        return {
          label: path ? `Édition de ${path}` : "Édition de fichier",
          Icon: FilePen,
        };
    }
  }

  if (toolName === "file_manager") {
    const newPath = args?.new_path;
    switch (command) {
      case "rename":
        return {
          label:
            path && newPath
              ? `Renommage de ${path} → ${newPath}`
              : path
                ? `Renommage de ${path}`
                : "Renommage de fichier",
          Icon: Replace,
        };
      case "delete":
        return {
          label: path ? `Suppression de ${path}` : "Suppression de fichier",
          Icon: Trash2,
        };
      default:
        return { label: "Gestion de fichier", Icon: Wrench };
    }
  }

  return { label: toolName, Icon: Wrench };
}
