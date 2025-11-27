import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardContent, CardHeader, TextArea, TextInput } from '@fanmeet/ui';
import { formatDateTime } from '@fanmeet/utils';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  audience: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const snippets = [
  { name: '{{fan_name}}', description: 'Fan\'s first name' },
  { name: '{{creator_name}}', description: 'Creator display name' },
  { name: '{{event_title}}', description: 'Event name' },
  { name: '{{cta_link}}', description: 'Primary button URL' },
  { name: '{{amount}}', description: 'Currency amount' },
];

export function AdminSettingsEmailTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editName, setEditName] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editAudience, setEditAudience] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching templates:', error);
        return;
      }

      const mapped: EmailTemplate[] = (data ?? []).map((t: any) => ({
        id: t.id,
        name: t.name,
        subject: t.subject,
        body: t.body,
        audience: t.audience,
        status: t.status,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      }));

      setTemplates(mapped);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchTemplates();
  }, []);

  const handleSelectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditName(template.name);
    setEditSubject(template.subject);
    setEditBody(template.body);
    setEditAudience(template.audience);
    setIsCreating(false);
  };

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setEditName('');
    setEditSubject('');
    setEditBody('');
    setEditAudience('all');
    setIsCreating(true);
  };

  const handleSave = async (status: 'draft' | 'active') => {
    if (!editName.trim() || !editSubject.trim()) {
      alert('Name and subject are required');
      return;
    }

    setIsLoading(true);
    try {
      if (isCreating) {
        const { error } = await supabase.from('email_templates').insert({
          name: editName.trim(),
          subject: editSubject.trim(),
          body: editBody.trim(),
          audience: editAudience.trim() || 'all',
          status,
          created_by: user?.id,
          updated_by: user?.id,
        });

        if (error) {
          console.error('Error creating template:', error);
          alert('Failed to create template');
          return;
        }
      } else if (selectedTemplate) {
        const { error } = await supabase
          .from('email_templates')
          .update({
            name: editName.trim(),
            subject: editSubject.trim(),
            body: editBody.trim(),
            audience: editAudience.trim() || 'all',
            status,
            updated_by: user?.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedTemplate.id);

        if (error) {
          console.error('Error updating template:', error);
          alert('Failed to update template');
          return;
        }
      }

      await fetchTemplates();
      alert(`Template ${isCreating ? 'created' : 'updated'} successfully!`);
      setIsCreating(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this template?');
    if (!confirmed) return;

    const { error } = await supabase.from('email_templates').delete().eq('id', templateId);

    if (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
      return;
    }

    await fetchTemplates();
    if (selectedTemplate?.id === templateId) {
      setSelectedTemplate(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1C1F]">Email Templates</h1>
          <p className="text-sm text-[#6C757D]">Manage transactional and lifecycle emails sent by FanMeet.</p>
        </div>
        <Button onClick={handleCreateNew}>Create New Template</Button>
      </div>

      <Card>
        <CardHeader title="Templates" subtitle={`${templates.length} templates`} />
        <CardContent className="space-y-4">
          {templates.length === 0 && (
            <p className="py-8 text-center text-sm text-[#6C757D]">
              {isLoading ? 'Loading...' : 'No templates yet. Create your first template.'}
            </p>
          )}
          {templates.map((template) => (
            <div
              key={template.id}
              className={`flex flex-col gap-4 rounded-[16px] border p-5 text-sm text-[#212529] cursor-pointer ${
                selectedTemplate?.id === template.id ? 'border-[#C045FF] bg-[#F4E6FF]/30' : 'border-[#E9ECEF] bg-[#F8F9FA]'
              }`}
              onClick={() => handleSelectTemplate(template)}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{template.name}</h2>
                  <p className="text-[#6C757D]">Subject: {template.subject}</p>
                  <p className="text-xs text-[#ADB5BD]">Audience: {template.audience}</p>
                </div>
                <Badge variant={template.status === 'active' ? 'success' : 'warning'}>
                  {template.status}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6C757D]">
                <span>Last updated: {formatDateTime(template.updatedAt)}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); handleDelete(template.id); }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {(selectedTemplate || isCreating) && (
        <Card>
          <CardHeader
            title={isCreating ? 'New Template' : 'Edit Template'}
            subtitle={isCreating ? 'Create a new email template' : selectedTemplate?.name}
          />
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <TextInput
                label="Template Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g., Welcome Email"
              />
              <TextInput
                label="Email Subject"
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
                placeholder="e.g., Welcome to FanMeet Five!"
              />
              <TextInput
                label="Audience"
                value={editAudience}
                onChange={(e) => setEditAudience(e.target.value)}
                placeholder="e.g., New fans, Creators"
              />
              <TextArea
                label="Body"
                rows={10}
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                placeholder="Hi {{fan_name}},&#10;&#10;Thanks for joining..."
              />
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => handleSave('draft')} disabled={isLoading}>
                  Save Draft
                </Button>
                <Button onClick={() => handleSave('active')} disabled={isLoading}>
                  Publish
                </Button>
              </div>
            </div>
            <div className="space-y-3 rounded-[16px] border border-[#E9ECEF] bg-white p-6 text-sm text-[#212529]">
              <h2 className="text-sm font-semibold">Available Snippets</h2>
              <ul className="space-y-2 text-[#6C757D]">
                {snippets.map((snippet) => (
                  <li key={snippet.name} className="flex items-center justify-between">
                    <code className="bg-[#F8F9FA] px-2 py-1 rounded text-xs">{snippet.name}</code>
                    <span className="text-xs">{snippet.description}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 rounded-[12px] bg-[#F8F9FA] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6C757D]">Preview</p>
                <p className="mt-2 whitespace-pre-line text-sm">
                  {editBody
                    .replace('{{fan_name}}', 'Neha')
                    .replace('{{creator_name}}', 'Priya')
                    .replace('{{event_title}}', 'Live Chat Session')
                    .replace('{{cta_link}}', 'https://fanmeet.app')
                    .replace('{{amount}}', '₹500')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
