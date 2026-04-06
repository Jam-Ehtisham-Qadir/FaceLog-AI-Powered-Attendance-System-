from django.urls import path
from .views import (
    RegisterEmployeeView,
    EmployeeDetailView,
    AddEmployeePhotoView,
    CheckInView,
    CheckOutView,
    AttendanceRecordsView,
    ExportAttendanceView,
    DashboardStatsView,
    AttendanceRecordDeleteView,
    AttendanceBulkDeleteView,
    ExportPayrollView,
    UpdateEmployeeSalaryView,
    AdminLoginView,
    AdminLogoutView,
)

urlpatterns = [
    path('employees/', RegisterEmployeeView.as_view(), name='employees'),
    path('employees/<int:pk>/', EmployeeDetailView.as_view(), name='employee-detail'),
    path('employees/<int:pk>/add-photos/', AddEmployeePhotoView.as_view(), name='add-employee-photos'),
    path('attendance/checkin/', CheckInView.as_view(), name='check-in'),
    path('attendance/checkout/', CheckOutView.as_view(), name='check-out'),
    path('attendance/records/', AttendanceRecordsView.as_view(), name='attendance-records'),
    path('attendance/export/', ExportAttendanceView.as_view(), name='export-attendance'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('attendance/records/<int:pk>/delete/', AttendanceRecordDeleteView.as_view(), name='delete-attendance-record'),
    path('attendance/records/bulk-delete/', AttendanceBulkDeleteView.as_view(), name='bulk-delete-attendance'),
    path('attendance/export-payroll/', ExportPayrollView.as_view(), name='export-payroll'),
    path('employees/<int:pk>/salary/', UpdateEmployeeSalaryView.as_view(), name='update-salary'),
    path('auth/login/', AdminLoginView.as_view(), name='admin-login'),
    path('auth/logout/', AdminLogoutView.as_view(), name='admin-logout'),
]