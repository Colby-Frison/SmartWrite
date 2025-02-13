from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from .models import Folder, Note, Attachment
import json
import os

# @login_required  # Comment this out
def workspace(request):
    return render(request, 'workspace/index.html')

# @login_required  # Comment this out
def get_file_tree(request):
    # For testing, return empty tree
    return JsonResponse({'tree': []})

def build_folder_tree(folder):
    return {
        'id': folder.id,
        'name': folder.name,
        'type': 'folder',
        'children': [
            build_folder_tree(child) for child in folder.folder_set.all()
        ] + [
            {
                'id': note.id,
                'name': note.name,
                'type': 'note',
            } for note in folder.note_set.all()
        ]
    }

@csrf_exempt
@login_required
def create_folder(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        folder = Folder.objects.create(
            name=data['name'],
            description=data.get('description', ''),
            user=request.user,
            parent_id=data.get('parent_id')
        )
        return JsonResponse({'id': folder.id, 'name': folder.name})
    return JsonResponse({'error': 'Invalid request'}, status=400)

@csrf_exempt
@login_required
def create_note(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        note = Note.objects.create(
            name=data['name'],
            description=data.get('description', ''),
            user=request.user,
            folder_id=data.get('folder_id')
        )
        return JsonResponse({'id': note.id, 'name': note.name})
    return JsonResponse({'error': 'Invalid request'}, status=400)

@csrf_exempt
@login_required
def upload_attachment(request):
    if request.method == 'POST':
        note_id = request.POST.get('note_id')
        file = request.FILES.get('file')
        
        if not all([note_id, file]):
            return JsonResponse({'error': 'Missing required fields'}, status=400)
        
        attachment = Attachment.objects.create(
            file=file,
            note_id=note_id,
            file_type=os.path.splitext(file.name)[1][1:]
        )
        
        return JsonResponse({
            'id': attachment.id,
            'name': attachment.file.name,
            'url': attachment.file.url
        })
    
    return JsonResponse({'error': 'Invalid request'}, status=400)

@csrf_exempt
def electron_api(request):
    """Handle Electron-specific API requests"""
    if request.method == 'POST':
        action = request.POST.get('action')
        if action == 'get_files':
            # Implement file system operations
            pass
        elif action == 'save_file':
            # Implement file saving
            pass
    return JsonResponse({'status': 'error', 'message': 'Invalid request'}) 