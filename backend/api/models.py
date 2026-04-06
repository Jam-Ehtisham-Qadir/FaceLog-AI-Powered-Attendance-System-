from django.db import models


class Employee(models.Model):
    name = models.CharField(max_length=100)
    employee_id = models.CharField(max_length=50, unique=True)
    department = models.CharField(max_length=100, blank=True)
    photo = models.ImageField(upload_to='employees/')
    salary = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.employee_id})"


class EmployeePhoto(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='extra_photos')
    photo = models.ImageField(upload_to='employees/extra/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Photo for {self.employee.name}"


class AttendanceRecord(models.Model):
    STATUS_CHOICES = [
        ('checked_in', 'Checked In'),
        ('checked_out', 'Checked Out'),
        ('spoof', 'Spoof Detected'),
        ('unknown', 'Unknown Face'),
    ]

    employee = models.ForeignKey(
        Employee, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='attendance_records'
    )
    date = models.DateField(auto_now_add=True)
    check_in_time = models.DateTimeField(null=True, blank=True)
    check_out_time = models.DateTimeField(null=True, blank=True)
    hours_worked = models.FloatField(default=0.0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='checked_in')
    confidence = models.FloatField(default=0.0)
    spoof_confidence = models.FloatField(default=0.0)
    spoof_reason = models.TextField(blank=True)
    captured_photo = models.ImageField(upload_to='attendance/', blank=True)

    def __str__(self):
        name = self.employee.name if self.employee else "Unknown"
        return f"{name} - {self.status} - {self.date}"