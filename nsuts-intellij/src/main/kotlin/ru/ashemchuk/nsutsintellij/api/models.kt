package ru.ashemchuk.nsutsintellij.api

import kotlinx.serialization.Serializable

/**
 * Represents an Olympiad.
 */
@Serializable
data class Olympiad(
    val id: String,
    val title: String,
    val coverUrl: String
)

/**
 * Represents a Tour.
 */
@Serializable
data class Tour(
    val id: String,
    val title: String
)

/**
 * Represents a Task.
 */
@Serializable
data class Task(
    val id: String,
    val title: String,
    val olympiadId: String,
    val tourId: String
)

/**
 * Active task selected by user.
 */
data class ActiveTask(
    val taskId: String,
    val name: String,
    val tourId: String,
    val olympiadId: String
)

/**
 * Context for a task (selected files and compiler).
 */
data class TaskContext(
    val files: List<String> = emptyList(),
    val compiler: String? = null
)

/**
 * Report status enum.
 */
enum class ReportStatus {
    Queued,
    Successful,
    Unsuccessful
}

/**
 * Submission report.
 */
@Serializable
data class Report(
    val id: String,
    val compiler: String,
    val date: String,
    val result_line: String,
    val status: ReportStatus,
    val task_id: String,
    val task_title: String,
    val testNumber: String? = null,
    val points: String? = null,
    val total: String? = null
)