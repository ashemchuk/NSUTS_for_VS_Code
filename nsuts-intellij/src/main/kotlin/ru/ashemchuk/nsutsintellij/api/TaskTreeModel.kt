package ru.ashemchuk.nsutsintellij.api

import com.intellij.ui.tree.BaseTreeModel
import kotlinx.coroutines.*
import javax.swing.tree.TreePath
import javax.swing.SwingUtilities

class TaskTreeModel(private val apiClient: ApiClient) : BaseTreeModel<Any>() {
    private var olympiads: List<Olympiad>? = null
    private val toursCache = mutableMapOf<String, List<Tour>>()
    private val tasksCache = mutableMapOf<String, List<Task>>()
    private val olympiadForTour = mutableMapOf<String, String>() // tourId -> olympiadId
    private val loadingNodes = mutableSetOf<Any>()

    override fun getRoot(): Any = this

    override fun getChildren(parent: Any): List<Any> {
        return when (parent) {
            is TaskTreeModel -> {
                // Root node, return olympiads
                if (olympiads == null) {
                    if (!loadingNodes.contains(parent)) {
                        loadingNodes.add(parent)
                        loadOlympiadsAsync()
                    }
                    return listOf("Loading olympiads...")
                }
                olympiads ?: emptyList()
            }
            is Olympiad -> {
                // Olympiad node, enter olympiad and return tours
                val cachedTours = toursCache[parent.id]
                if (cachedTours == null) {
                    if (!loadingNodes.contains(parent)) {
                        loadingNodes.add(parent)
                        loadToursAsync(parent)
                    }
                    return listOf("Loading tours...")
                }
                cachedTours
            }
            is Tour -> {
                // Tour node, return tasks
                val olympiadId = olympiadForTour[parent.id]
                if (olympiadId != null) {
                    val cacheKey = "${olympiadId}_${parent.id}"
                    val cachedTasks = tasksCache[cacheKey]
                    if (cachedTasks == null) {
                        if (!loadingNodes.contains(parent)) {
                            loadingNodes.add(parent)
                            loadTasksAsync(parent, olympiadId)
                        }
                        return listOf("Loading tasks...")
                    }
                    cachedTasks
                } else {
                    emptyList()
                }
            }
            else -> emptyList()
        }
    }

    override fun isLeaf(node: Any): Boolean {
        return node is Task
    }

    fun refresh() {
        olympiads = null
        toursCache.clear()
        tasksCache.clear()
        olympiadForTour.clear()
        loadingNodes.clear()
        treeStructureChanged(TreePath(getRoot()), null, null)
    }

    private fun loadOlympiadsAsync() {
        GlobalScope.launch(Dispatchers.IO) {
            try {
                val result = apiClient.getOlympiads()
                SwingUtilities.invokeLater {
                    olympiads = result
                    loadingNodes.remove(this@TaskTreeModel)
                    treeStructureChanged(TreePath(getRoot()), null, null)
                }
            } catch (e: Exception) {
                e.printStackTrace()
                SwingUtilities.invokeLater {
                    loadingNodes.remove(this@TaskTreeModel)
                    treeStructureChanged(TreePath(getRoot()), null, null)
                }
            }
        }
    }

    private fun loadToursAsync(olympiad: Olympiad) {
        GlobalScope.launch(Dispatchers.IO) {
            try {
                // Enter the olympiad first
                apiClient.enterOlympiad(olympiad.id)
                // Then get the tours
                val result = apiClient.getTours()
                SwingUtilities.invokeLater {
                    if (result != null) {
                        toursCache[olympiad.id] = result
                        // Store the mapping from tourId to olympiadId
                        result.forEach { tour ->
                            olympiadForTour[tour.id] = olympiad.id
                        }
                    }
                    loadingNodes.remove(olympiad)
                    // Only update the specific olympiad node
                    treeStructureChanged(TreePath(arrayOf(getRoot(), olympiad)), null, null)
                }
            } catch (e: Exception) {
                e.printStackTrace()
                SwingUtilities.invokeLater {
                    loadingNodes.remove(olympiad)
                    // Only update the specific olympiad node
                    treeStructureChanged(TreePath(arrayOf(getRoot(), olympiad)), null, null)
                }
            }
        }
    }

    private fun loadTasksAsync(tour: Tour, olympiadId: String) {
        GlobalScope.launch(Dispatchers.IO) {
            try {
                // Enter the tour
                apiClient.enterTour(tour.id.toInt())
                // Then get the tasks for the tour
                val result = apiClient.getTasks(olympiadId, tour.id)
                SwingUtilities.invokeLater {
                    if (result != null) {
                        val cacheKey = "${olympiadId}_${tour.id}"
                        tasksCache[cacheKey] = result
                    }
                    loadingNodes.remove(tour)
                    // Only update the specific tour node
                    val olympiad = olympiads?.find { it.id == olympiadId }
                    if (olympiad != null) {
                        treeStructureChanged(TreePath(arrayOf(getRoot(), olympiad, tour)), null, null)
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
                SwingUtilities.invokeLater {
                    loadingNodes.remove(tour)
                    // Only update the specific tour node
                    val olympiad = olympiads?.find { it.id == olympiadId }
                    if (olympiad != null) {
                        treeStructureChanged(TreePath(arrayOf(getRoot(), olympiad, tour)), null, null)
                    }
                }
            }
        }
    }
}