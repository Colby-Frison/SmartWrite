from django.urls import path
from . import views

app_name = 'workspace'

urlpatterns = [
    path('', views.workspace, name='workspace'),
    path('api/file-tree/', views.get_file_tree, name='file_tree'),
    path('api/create-folder/', views.create_folder, name='create_folder'),
    path('api/create-note/', views.create_note, name='create_note'),
    path('api/upload-attachment/', views.upload_attachment, name='upload_attachment'),
] 