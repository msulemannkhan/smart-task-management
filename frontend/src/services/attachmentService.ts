import api from './api';

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploaded_by: {
    id: string;
    full_name: string;
    email: string;
  };
  uploaded_at: string;
}

export interface AttachmentResponse {
  attachments: Attachment[];
}

export class AttachmentService {
  // Get all attachments for a task
  static async getTaskAttachments(taskId: string): Promise<Attachment[]> {
    const response = await api.get(`/tasks/${taskId}/attachments`);
    return response.data;
  }

  // Upload attachments to a task
  static async uploadTaskAttachments(taskId: string, files: File[]): Promise<Attachment[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await api.post(`/tasks/${taskId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Delete an attachment
  static async deleteTaskAttachment(taskId: string, attachmentId: string): Promise<void> {
    await api.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
  }

  // Get download URL for an attachment
  static getDownloadUrl(attachmentId: string): string {
    return `${api.defaults.baseURL}/tasks/attachments/${attachmentId}/download`;
  }

  // Download an attachment
  static async downloadAttachment(attachmentId: string): Promise<Blob> {
    const response = await api.get(`/tasks/attachments/${attachmentId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }
}