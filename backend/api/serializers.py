from rest_framework import serializers
from .models import Employee, EmployeePhoto, AttendanceRecord


class EmployeePhotoSerializer(serializers.ModelSerializer):
    photo_url = serializers.SerializerMethodField()

    class Meta:
        model = EmployeePhoto
        fields = ['id', 'photo_url', 'uploaded_at']

    def get_photo_url(self, obj):
        request = self.context.get('request')
        if obj.photo:
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return f"/media/{obj.photo}"
        return None


class EmployeeSerializer(serializers.ModelSerializer):
    photo_url = serializers.SerializerMethodField()
    extra_photos = EmployeePhotoSerializer(many=True, read_only=True)
    total_photos = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = ['id', 'name', 'employee_id', 'department', 'salary', 'photo', 'photo_url', 'extra_photos', 'total_photos', 'created_at']
        extra_kwargs = {'photo': {'write_only': True}}

    def get_photo_url(self, obj):
        request = self.context.get('request')
        if obj.photo:
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return f"/media/{obj.photo}"
        return None

    def get_total_photos(self, obj):
        return obj.extra_photos.count() + 1


class AttendanceRecordSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    employee_id = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    check_in_time_str = serializers.SerializerMethodField()
    check_out_time_str = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'employee_name', 'employee_id', 'department',
            'date', 'check_in_time_str', 'check_out_time_str',
            'hours_worked', 'status', 'confidence', 'spoof_confidence', 'spoof_reason'
        ]

    def get_employee_name(self, obj):
        return obj.employee.name if obj.employee else "Unknown"

    def get_employee_id(self, obj):
        return obj.employee.employee_id if obj.employee else "-"

    def get_department(self, obj):
        return obj.employee.department if obj.employee else "-"

    def get_check_in_time_str(self, obj):
        if obj.check_in_time:
            import pytz
            karachi = pytz.timezone('Asia/Karachi')
            return obj.check_in_time.astimezone(karachi).strftime('%I:%M %p')
        return "-"

    def get_check_out_time_str(self, obj):
        if obj.check_out_time:
            import pytz
            karachi = pytz.timezone('Asia/Karachi')
            return obj.check_out_time.astimezone(karachi).strftime('%I:%M %p')
        return "-"