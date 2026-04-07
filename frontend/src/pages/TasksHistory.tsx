import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiService } from '@/lib/api';
import { TaskSummary, TaskSummaryListResponse, TaskDetail, TaskState } from '@/lib/api';
import { TaskThroughputChart } from '@/components/TaskThroughputChart';
import TaskLatencyChart from '@/components/TaskLatencyChart';
import TaskBackpressureChart from '@/components/TaskBackpressureChart';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ChevronUp, Search, RefreshCw, Loader2, Trash2, Eye, Clock, AlertTriangle, Layers } from 'lucide-react';

const TasksHistory: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasksResponse, setTasksResponse] = useState<TaskSummaryListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<TaskSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [expandedTaskDetail, setExpandedTaskDetail] = useState<TaskDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [filters, setFilters] = useState({
    task_id: searchParams.get('task_id') || '',
    status: searchParams.get('status') || 'all',
    task_type: searchParams.get('task_type') || 'all',
    page: parseInt(searchParams.get('page') || '1', 10),
  });

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filterParams: Record<string, unknown> = {
        ...filters,
        page_size: 10,
        sort_by: 'created_at',
        sort_order: 'desc'
      };
      // Don't send status filter if "all" is selected
      if (filters.status === 'all' || filters.status === '') {
        filterParams.status = undefined;
      }
      // Don't send task_type filter if "all" is selected
      if (filters.task_type === 'all' || filters.task_type === '') {
        filterParams.task_type = undefined;
      }
      // Only send task_id if it has at least 1 character
      if (filters.task_id && filters.task_id.trim().length > 0) {
        filterParams.task_id = filters.task_id.trim();
      } else {
        filterParams.task_id = undefined;
      }
      const data = await apiService.fetchTaskSummaries(filterParams);
      setTasksResponse(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadTasks();
    setSearchParams(
      Object.fromEntries(
        Object.entries(filters).map(([key, value]) => [key, String(value)])
      )
    );
  }, [loadTasks, filters, setSearchParams]);

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  // Check if pagination should be shown
  const shouldShowPagination = useMemo(() => {
    return tasksResponse && tasksResponse.total_pages > 1;
  }, [tasksResponse]);

  const renderStateBadge = (state: TaskState) => {
    const colorMap: { [key in TaskState]: string } = {
      [TaskState.PENDING]: 'bg-yellow-500 border-yellow-600',
      [TaskState.ACTIVE]: 'bg-green-500 border-green-600',
      [TaskState.COMPLETED]: 'bg-green-500 border-green-600',
      [TaskState.FAILED]: 'bg-yellow-500 border-yellow-600',
      [TaskState.SCHEDULED]: 'bg-yellow-500 border-yellow-600',
      [TaskState.DLQ]: 'bg-red-500 border-red-600',
    };
    return <Badge className={`${colorMap[state]} text-white border`}>{state}</Badge>;
  };

  const getTaskType = (task: TaskSummary): string => {
    // Return the task_type from the backend, which should handle the fallback logic
    return task.task_type || 'summarize';
  };

  const renderTaskTypeBadge = (taskType: string) => {
    const colorMap: { [key: string]: string } = {
      'summarize': 'bg-blue-500 border-blue-600',
      'pdfxtract': 'bg-purple-500 border-purple-600',
    };
    return <Badge className={`${colorMap[taskType] || 'bg-gray-500 border-gray-600'} text-white border`}>{taskType}</Badge>;
  };

  const calculateDuration = (task: TaskSummary | TaskDetail): string => {
    if (task.completed_at) {
      const duration = (new Date(task.completed_at).getTime() - new Date(task.created_at).getTime()) / 1000;
      return `${duration}s`;
    }
    return 'N/A';
  };

  const handleDeleteClick = (task: TaskSummary) => {
    setTaskToDelete(task);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;

    setDeleting(true);
    try {
      await apiService.deleteTask(taskToDelete.task_id);
      setDeleteModalOpen(false);
      setTaskToDelete(null);
      // Reload tasks to reflect the deletion
      await loadTasks();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setTaskToDelete(null);
  };

  const toggleTaskDetails = async (taskId: string) => {
    if (expandedTaskId === taskId) {
      // Collapse
      setExpandedTaskId(null);
      setExpandedTaskDetail(null);
    } else {
      // Expand
      setExpandedTaskId(taskId);
      setLoadingDetail(true);
      try {
        const detail = await apiService.fetchTaskDetail(taskId);
        setExpandedTaskDetail(detail);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch task details');
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  const collapseTaskDetails = () => {
    setExpandedTaskId(null);
    setExpandedTaskDetail(null);
  };

  const renderTaskDetailsCard = (task: TaskSummary) => {
    if (expandedTaskId !== task.task_id) return null;

    return (
      <TableRow>
        <TableCell colSpan={5} className="p-0 border-b border-white/5">
          <div className="bg-black/40 backdrop-blur-md border-t border-white/10 p-6 space-y-6 shadow-inner">
            {/* Header with Collapse Button */}
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <h4 className="font-semibold text-foreground text-lg tracking-tight">Task Details</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={collapseTaskDetails}
                className="flex items-center space-x-1 hover:bg-white/10 text-muted-foreground hover:text-foreground"
              >
                <ChevronUp className="h-4 w-4" />
                <span>Collapse</span>
              </Button>
            </div>

            {loadingDetail ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-muted-foreground">Loading task details...</p>
              </div>
            ) : expandedTaskDetail ? (
              <>
                {/* Metadata Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-4 border-b border-white/10">
                  <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                    <h5 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" /> Timing Information
                    </h5>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex justify-between"><span className="text-foreground/80">Created:</span> {format(new Date(expandedTaskDetail.created_at), 'PPpp')}</div>
                      <div className="flex justify-between"><span className="text-foreground/80">Updated:</span> {format(new Date(expandedTaskDetail.updated_at), 'PPpp')}</div>
                      {expandedTaskDetail.completed_at && (
                        <div className="flex justify-between"><span className="text-foreground/80">Completed:</span> {format(new Date(expandedTaskDetail.completed_at), 'PPpp')}</div>
                      )}
                      <div className="flex justify-between"><span className="text-foreground/80">Duration:</span> {calculateDuration(expandedTaskDetail)}</div>
                    </div>
                  </div>

                  <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                    <h5 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" /> Retry Information
                    </h5>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex justify-between"><span className="text-foreground/80">Retry Count:</span> {expandedTaskDetail.retry_count} / {expandedTaskDetail.max_retries}</div>
                      {expandedTaskDetail.retry_after && (
                        <div className="flex justify-between"><span className="text-foreground/80">Retry After:</span> {format(new Date(expandedTaskDetail.retry_after), 'PPpp')}</div>
                      )}
                      {expandedTaskDetail.last_error && (
                        <div className="mt-2 text-red-400 text-xs bg-red-500/10 p-2 rounded border border-red-500/20 break-all">
                          <span className="font-medium block mb-1">Last Error:</span>
                          {expandedTaskDetail.last_error}
                        </div>
                      )}
                      {expandedTaskDetail.error_type && (
                        <div className="flex justify-between mt-1"><span className="text-foreground/80">Error Type:</span> <span className="text-red-400">{expandedTaskDetail.error_type}</span></div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                    <h5 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-500" /> Content Information
                    </h5>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex justify-between"><span className="text-foreground/80">Content Length:</span> {expandedTaskDetail.content?.length || 0} chars</div>
                      <div className="flex justify-between"><span className="text-foreground/80">Has Result:</span> {expandedTaskDetail.result ? 'Yes' : 'No'}</div>
                      {expandedTaskDetail.result && (
                        <div className="flex justify-between"><span className="text-foreground/80">Result Length:</span> {expandedTaskDetail.result.length} chars</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* State History */}
                <div>
                  <h5 className="font-semibold text-foreground mb-3">State Transition History</h5>
                  <div className="bg-white/5 border border-white/10 rounded-md p-4 max-h-48 overflow-y-auto custom-scrollbar">
                    <div className="space-y-2">
                      {expandedTaskDetail.state_history?.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between py-2 border-b border-white/5 last:border-b-0">
                          <div className="flex items-center space-x-2">
                            {renderStateBadge(entry.state)}
                          </div>
                          <span className="text-xs text-muted-foreground font-mono">
                            {format(new Date(entry.timestamp), 'PPpp')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Error History */}
                {expandedTaskDetail.error_history && expandedTaskDetail.error_history.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-foreground mb-3">Error History</h5>
                    <div className="bg-white/5 border border-white/10 rounded-md p-4 max-h-48 overflow-y-auto custom-scrollbar">
                      <div className="space-y-3">
                        {expandedTaskDetail.error_history.map((error, index) => (
                          <div key={index} className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                            <div className="text-sm">
                              <div className="font-medium text-red-400 mb-1">Error #{index + 1}</div>
                              <pre className="text-xs text-red-300/80 whitespace-pre-wrap font-mono bg-black/20 p-2 rounded">{JSON.stringify(error, null, 2)}</pre>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Result Section - Only for completed tasks */}
                {expandedTaskDetail.state === TaskState.COMPLETED && expandedTaskDetail.result && (
                  <div>
                    <h5 className="font-semibold text-foreground mb-3">Task Result</h5>
                    <div className="bg-white/5 border border-white/10 rounded-md p-4 max-h-64 overflow-y-auto custom-scrollbar">
                      <pre className="text-sm whitespace-pre-wrap text-muted-foreground font-mono">{expandedTaskDetail.result}</pre>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-red-500">Failed to load task details</p>
              </div>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            Tasks History
          </h1>
          {loading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
        </div>
      </div>

      {/* Task Throughput Chart */}
      <TaskThroughputChart refreshInterval={2000} />

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <TaskLatencyChart pollingInterval={5000} />
        <TaskBackpressureChart pollingInterval={5000} />
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={loadTasks}
          className="bg-surface/50 border-white/10 hover:bg-white/10"
          title="Refresh Tasks"
        >
          <div className={loading ? "animate-spin" : ""}>
            <RefreshCw className="h-4 w-4" />
          </div>
        </Button>

        <div className="relative flex-grow md:flex-grow-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Task ID..."
            value={filters.task_id}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('task_id', e.target.value)}
            className="pl-9 w-full md:w-[200px] bg-surface/50 border-white/10 focus:border-primary/50"
          />
        </div>

        <Select
          value={filters.status}
          onValueChange={(value: string) => handleFilterChange('status', value)}
        >
          <SelectTrigger className="w-[160px] bg-surface/50 border-white/10">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-950 border-zinc-800">
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.values(TaskState).map((state) => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.task_type}
          onValueChange={(value: string) => handleFilterChange('task_type', value)}
        >
          <SelectTrigger className="w-[160px] bg-surface/50 border-white/10">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-950 border-zinc-800">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="summarize">Summarize</SelectItem>
            <SelectItem value="pdfxtract">PDF Extract</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {tasksResponse && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Task Type</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasksResponse.tasks.map((task: TaskSummary) => (
                <React.Fragment key={task.task_id}>
                  <TableRow className={`border-b border-white/5 ${expandedTaskId === task.task_id ? 'bg-primary/5' : 'hover:bg-white/5'}`}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{task.task_id}</TableCell>
                    <TableCell>{renderStateBadge(task.state)}</TableCell>
                    <TableCell>{renderTaskTypeBadge(getTaskType(task))}</TableCell>
                    <TableCell className="text-muted-foreground">{format(new Date(task.created_at), 'PPpp')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleTaskDetails(task.task_id)}
                          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          title={expandedTaskId === task.task_id ? "Hide Details" : "View Details"}
                        >
                          {expandedTaskId === task.task_id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(task)}
                          className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                          title="Delete Task"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {renderTaskDetailsCard(task)}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {(() => {
                const totalTasks = tasksResponse.total_items;
                const actualTasksOnPage = tasksResponse.tasks.length;
                const currentPage = tasksResponse.page;
                const pageSize = tasksResponse.page_size;

                if (totalTasks === 0) {
                  return "No tasks found";
                }

                // Calculate the actual start position for this page
                // The backend handles pagination correctly, so we can trust the page info
                const startLine = ((currentPage - 1) * pageSize) + 1;
                const endLine = startLine + actualTasksOnPage - 1;

                if (actualTasksOnPage === 1) {
                  return `Showing task ${startLine} of ${totalTasks}`;
                }

                return `Showing tasks ${startLine}-${endLine} of ${totalTasks}`;
              })()}
            </p>
            {shouldShowPagination && (
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page <= 1}
                >
                  Previous
                </Button>
                <Button
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page >= tasksResponse.total_pages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </>
      )
      }

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete task <span className="font-mono text-sm">{taskToDelete?.task_id}</span>?
              <br />
              <br />
              This will permanently remove the task from all Redis queues, states, and statistics. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Deleting...' : 'Delete Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
};

export default TasksHistory;
