from django.contrib import admin
from .models import Employee, EmployeePhoto, AttendanceRecord


class EmployeePhotoInline(admin.TabularInline):
    model = EmployeePhoto
    extra = 1


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['name', 'employee_id', 'department', 'created_at']
    search_fields = ['name', 'employee_id', 'department']
    ordering = ['-created_at']
    inlines = [EmployeePhotoInline]


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ['get_employee_name', 'status', 'confidence', 'spoof_confidence', 'date', 'check_in_time', 'check_out_time', 'hours_worked']
    list_filter = ['status', 'date']
    search_fields = ['employee__name', 'employee__employee_id']
    ordering = ['-date', '-check_in_time']

    def get_employee_name(self, obj):
        return obj.employee.name if obj.employee else "Unknown"
    get_employee_name.short_description = 'Employee'