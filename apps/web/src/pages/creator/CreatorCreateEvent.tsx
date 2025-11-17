import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardContent, CardHeader, TextInput, TextArea, Badge } from '@fanmeet/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useEvents } from '../../contexts/EventContext';

const priceOptions = ['₹50', '₹100', '₹150'];
const durationOptions = ['5 minutes', '10 minutes', '15 minutes'];

export function CreatorCreateEvent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createEvent } = useEvents();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState<number | null>(null);
  const [duration, setDuration] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [formError, setFormError] = useState('');

  const handleCreateEvent = () => {
    if (!user || user.role !== 'creator') {
      window.alert('Please login as a creator to create events.');
      navigate('/auth?redirect=/creator/events/new');
      return;
    }

    if (!title.trim() || !basePrice || !duration || !date || !time) {
      setFormError('Please fill in all required fields before creating the event.');
      return;
    }

    setFormError('');

    const creatorDisplayName = user.email.split('@')[0] || user.username;

    const event = createEvent({
      creatorUsername: user.username,
      creatorDisplayName,
      title: title.trim(),
      description: description.trim() || undefined,
      basePrice,
      duration,
      date,
      time,
    });

    const slug = event.creatorUsername;
    const url = `${window.location.origin}/${slug}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(
        () => {
          window.alert('Event created! Share link copied to your clipboard.');
        },
        () => {
          window.prompt('Event created! Share this link with your fans:', url);
        },
      );
    } else {
      window.prompt('Event created! Share this link with your fans:', url);
    }

    navigate('/creator/events');
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#212529]">Create New Event</h1>
          <p className="text-sm text-[#6C757D]">Set up a new live experience for your fans.</p>
        </div>
        <Badge variant="primary" className="px-4 py-2 text-sm">
          Preview updates in real time
        </Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card elevated className="p-0">
          <CardHeader
            title="Event Details"
            subtitle="Provide the basics so fans know what to expect"
            className="border-b border-[#E9ECEF] px-8 py-6"
          />
          <CardContent className="gap-6 px-8 py-6">
            <div className="flex flex-col gap-4">
              <span className="text-sm font-semibold text-[#212529]">Event Type *</span>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" size="sm" className="rounded-[8px]">
                  Paid Event
                </Button>
                <Button variant="ghost" size="sm" className="rounded-[8px]">
                  Free Event
                </Button>
              </div>
            </div>

            <TextInput
              label="Event Title *"
              placeholder="Give your event an exciting headline"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />

            <TextArea
              label="Description"
              placeholder="Describe the experience, topics, or value fans will get."
              rows={5}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />

            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-3">
                <span className="text-sm font-semibold text-[#212529]">Base Price *</span>
                <div className="flex flex-wrap gap-3">
                  {priceOptions.map((price) => {
                    const numeric = parseInt(price.replace(/[^0-9]/g, ''), 10) || 0;
                    const isActive = basePrice === numeric;

                    return (
                      <Button
                        key={price}
                        variant={isActive ? 'primary' : 'secondary'}
                        size="sm"
                        className="rounded-[8px]"
                        onClick={() => setBasePrice(numeric)}
                      >
                        {price}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-sm font-semibold text-[#212529]">Duration *</span>
                <div className="flex flex-wrap gap-3">
                  {durationOptions.map((option) => (
                    <Button
                      key={option}
                      variant={duration === option ? 'primary' : 'secondary'}
                      size="sm"
                      className="rounded-[8px]"
                      onClick={() => setDuration(option)}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <TextInput
                type="date"
                label="Schedule Date *"
                required
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
              <TextInput
                type="time"
                label="Schedule Time *"
                required
                value={time}
                onChange={(event) => setTime(event.target.value)}
              />
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-sm font-semibold text-[#212529]">Cover Image (optional)</span>
              <div className="flex h-44 flex-col items-center justify-center gap-3 rounded-[16px] border-2 border-dashed border-[#E9ECEF] bg-[#F8F9FA]">
                <span className="text-2xl">📁</span>
                <span className="text-sm font-medium text-[#212529]">Drag & Drop or click to upload</span>
                <span className="text-xs text-[#6C757D]">JPG, PNG, or WEBP up to 5MB</span>
                <Button size="sm" variant="secondary">
                  Browse Files
                </Button>
              </div>
            </div>

            {formError ? <p className="text-sm font-medium text-[#DC3545]">{formError}</p> : null}
          </CardContent>
          <div className="flex justify-end gap-3 border-t border-[#E9ECEF] px-8 py-6">
            <Button variant="secondary">Cancel</Button>
            <Button onClick={handleCreateEvent}>Create Event →</Button>
          </div>
        </Card>

        <Card className="h-fit">
          <CardHeader title="Preview" subtitle="Fans will see this layout before bidding" />
          <CardContent className="gap-4">
            <div className="h-32 rounded-[16px] bg-gradient-to-br from-[#FFE5D9] to-white" />
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-semibold text-[#212529]">Meet & Greet - Q&A Session</h3>
              <p className="text-sm text-[#6C757D]">Jan 15 • 4:00 PM IST • 10 minutes</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="danger">🔴 LIVE SOON</Badge>
              <Badge variant="primary">Base Price: ₹100</Badge>
            </div>
            <div className="rounded-[12px] bg-[#F8F9FA] p-4 text-sm text-[#6C757D]">
              Fans can view event info, schedule, and place their bids here.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
