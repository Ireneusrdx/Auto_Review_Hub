from django.contrib import admin
from .models import CarModel, CarMake


# CarModelInline class
class CarModelInline(admin.StackedInline):
    model = CarModel
    extra = 5


# CarModelAdmin class
class CarModelAdmin(admin.ModelAdmin):
    list_display = ('name', 'car_make', 'type', 'year')
    list_filter = ('car_make', 'type')
    search_fields = ('name',)


# CarMakeAdmin class with CarModelInline
class CarMakeAdmin(admin.ModelAdmin):
    inlines = [CarModelInline]
    list_display = ('name', 'description')
    search_fields = ('name',)


# Register models here
admin.site.register(CarMake, CarMakeAdmin)
admin.site.register(CarModel, CarModelAdmin)
