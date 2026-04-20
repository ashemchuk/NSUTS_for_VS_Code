package ru.ashemchuk.nsutsintellij.storage

import com.intellij.ide.util.PropertiesComponent
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import ru.ashemchuk.nsutsintellij.api.ActiveTask
import ru.ashemchuk.nsutsintellij.api.TaskContext

/**
 * Persistent storage for user's selected task and context.
 */
object StateRepository {
    private const val ACTIVE_TASK_KEY = "nsuts.activeTask"
    private const val TASK_CONTEXT_KEY = "nsuts.taskContext"
    
    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
    }
    
    /**
     * Save active task.
     */
    fun saveActiveTask(task: ActiveTask?) {
        val jsonString = task?.let { json.encodeToString(it) } ?: ""
        PropertiesComponent.getInstance().setValue(ACTIVE_TASK_KEY, jsonString)
    }
    
    /**
     * Load active task, or null if not saved.
     */
    fun loadActiveTask(): ActiveTask? {
        val jsonString = PropertiesComponent.getInstance().getValue(ACTIVE_TASK_KEY)
        if (jsonString.isNullOrBlank()) return null
        return try {
            json.decodeFromString(jsonString)
        } catch (e: Exception) {
            null
        }
    }
    
    /**
     * Save task context (files and compiler).
     */
    fun saveTaskContext(context: TaskContext?) {
        val jsonString = context?.let { json.encodeToString(it) } ?: ""
        PropertiesComponent.getInstance().setValue(TASK_CONTEXT_KEY, jsonString)
    }
    
    /**
     * Load task context, or null if not saved.
     */
    fun loadTaskContext(): TaskContext? {
        val jsonString = PropertiesComponent.getInstance().getValue(TASK_CONTEXT_KEY)
        if (jsonString.isNullOrBlank()) return null
        return try {
            json.decodeFromString(jsonString)
        } catch (e: Exception) {
            null
        }
    }
    
    /**
     * Clear all saved state.
     */
    fun clear() {
        PropertiesComponent.getInstance().setValue(ACTIVE_TASK_KEY, "")
        PropertiesComponent.getInstance().setValue(TASK_CONTEXT_KEY, "")
    }
}