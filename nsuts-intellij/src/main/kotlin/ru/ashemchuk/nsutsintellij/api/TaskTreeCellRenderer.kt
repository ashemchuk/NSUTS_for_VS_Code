package ru.ashemchuk.nsutsintellij.api

import com.intellij.icons.AllIcons
import com.intellij.ui.ColoredTreeCellRenderer
import com.intellij.ui.SimpleTextAttributes
import com.intellij.util.ui.UIUtil
import javax.swing.JTree

class TaskTreeCellRenderer : ColoredTreeCellRenderer() {
    override fun customizeCellRenderer(
        tree: JTree,
        value: Any?,
        selected: Boolean,
        expanded: Boolean,
        leaf: Boolean,
        row: Int,
        hasFocus: Boolean
    ) {
        when (value) {
            is Olympiad -> {
                icon = AllIcons.Nodes.Module
                append(value.title)
            }
            is Tour -> {
                icon = AllIcons.Nodes.Folder
                append(value.title)
            }
            is Task -> {
                icon = AllIcons.FileTypes.Text
                append(value.title)
            }
            is TaskTreeModel -> {
                icon = AllIcons.Actions.ProjectDirectory
                append("Olympiads")
            }
            is String -> {
                // Handle loading messages
                append(value, SimpleTextAttributes.GRAYED_ATTRIBUTES)
            }
            else -> {
                append(value?.toString() ?: "")
            }
        }
    }
}