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
  const [biddingDeadlineDate, setBiddingDeadlineDate] = useState('');
  const [biddingDeadlineTime, setBiddingDeadlineTime] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [formError, setFormError] = useState('');
  const [eventType, setEventType] = useState<'paid' | 'free'>('paid');

  const handleCreateEvent = async () => {
    if (!user || user.role !== 'creator') {
      window.alert('Please login as a creator to create events.');
      navigate('/auth?redirect=/creator/events/new');
      return;
    }

    // Check if creator is approved by admin
    if (user.creatorProfileStatus !== 'approved') {
      const statusMsg = user.creatorProfileStatus === 'pending' 
        ? 'Your creator profile is pending approval. Please wait for admin approval before creating events.'
        : 'Your creator profile has been rejected. Please contact support for more information.';
      window.alert(`⚠️ ${statusMsg}`);
      return;
    }

    if (!title.trim() || basePrice === null || !duration || !date || !time || !biddingDeadlineDate || !biddingDeadlineTime || !meetingLink) {
      setFormError('Please fill in all required fields before creating the event.');
      return;
    }

    setFormError('');

    const creatorDisplayName = user.email.split('@')[0] || user.username;

    try {
      const event = await createEvent({
        creatorUsername: user.username,
        creatorDisplayName,
        title: title.trim(),
        description: description.trim() || undefined,
        basePrice,
        duration,
        date,
        time,
        biddingDeadlineDate,
        biddingDeadlineTime,
        meetingLink: meetingLink.trim(),
      });

      const url = `${window.location.origin}/events/${event.id}`;

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
    } catch (error) {
      console.error('Failed to create event:', error);
      setFormError('Failed to create event. Please try again.');
    }
  };

  // Show approval status warning
  const isApproved = user?.creatorProfileStatus === 'approved';
  const isPending = user?.creatorProfileStatus === 'pending';

  return (
    <div className="flex flex-col gap-8">
      {/* Approval Warning Banner */}
      {user && user.role === 'creator' && !isApproved && (
        <div className={`rounded-[12px] p-4 ${isPending ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{isPending ? '⏳' : '❌'}</span>
            <div>
              <h3 className={`font-semibold ${isPending ? 'text-yellow-800' : 'text-red-800'}`}>
                {isPending ? 'Profile Pending Approval' : 'Profile Not Approved'}
              </h3>
              <p className={`text-sm ${isPending ? 'text-yellow-700' : 'text-red-700'}`}>
                {isPending 
                  ? 'Your creator profile is being reviewed by our team. You cannot create events until approved.'
                  : 'Your creator profile was not approved. Please contact support for more information.'}
              </p>
            </div>
          </div>
        </div>
      )}

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
                <Button
                  variant={eventType === 'paid' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="rounded-[8px]"
                  onClick={() => {
                    setEventType('paid');
                    setBasePrice(null);
                  }}
                >
                  Paid Event
                </Button>
                <Button
                  variant={eventType === 'free' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="rounded-[8px]"
                  onClick={() => {
                    setEventType('free');
                    setBasePrice(0);
                  }}
                >
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
                  {eventType === 'free' ? (
                    <Button variant="primary" size="sm" className="rounded-[8px]" disabled>
                      Free (₹0)
                    </Button>
                  ) : (
                    priceOptions.map((price) => {
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
                    })
                  )}
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
                label="Event Date *"
                required
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
              <TextInput
                type="time"
                label="Event Time *"
                required
                value={time}
                onChange={(event) => setTime(event.target.value)}
              />
            </div>

            <div className="rounded-[12px] border border-[#E9ECEF] bg-[#F8F9FA] p-4">
              <div className="mb-3 text-sm font-semibold text-[#212529]">⏰ Bidding Window *</div>
              <p className="mb-4 text-xs text-[#6C757D]">
                Set when bidding closes. Fans can bid until this time, and the highest bidder wins.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <TextInput
                  type="date"
                  label="Bidding Closes Date *"
                  required
                  value={biddingDeadlineDate}
                  onChange={(event) => setBiddingDeadlineDate(event.target.value)}
                />
                <TextInput
                  type="time"
                  label="Bidding Closes Time *"
                  required
                  value={biddingDeadlineTime}
                  onChange={(event) => setBiddingDeadlineTime(event.target.value)}
                />
              </div>
            </div>

            <div className="rounded-[12px] border border-[#E9ECEF] bg-[#F8F9FA] p-4">
              <div className="mb-3 text-sm font-semibold text-[#212529]">📹 Meeting Link *</div>
              <p className="mb-4 text-xs text-[#6C757D]">
                Add the Google Meet link for the session. This will be automatically sent to the winner.
              </p>
              <TextInput
                type="url"
                label="Google Meet Link"
                placeholder="https://meet.google.com/..."
                required
                value={meetingLink}
                onChange={(event) => setMeetingLink(event.target.value)}
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
