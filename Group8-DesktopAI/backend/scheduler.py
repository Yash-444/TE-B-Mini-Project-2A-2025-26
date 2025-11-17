# backend/scheduler.py

from apscheduler.schedulers.background import BackgroundScheduler
from plyer import notification  # Import the notification component
import datetime

# This is the function that will be executed when a reminder is due
def trigger_reminder(message: str):
    """
    This function is now called by the scheduler to display a native
    desktop notification.
    """
    print(f"Triggering reminder: {message}") # We can still print for logging
    
    try:
        notification.notify(
            title=f"AI Assistant Reminder [{datetime.datetime.now().strftime('%I:%M %p')}]",
            message=message,
            app_name='AI Assistant',
            timeout=30  # Notification will stay for 30 seconds
        )
    except Exception as e:
        # This will catch errors if the notification system fails on a specific OS
        print(f"Error displaying notification: {e}")
        # As a fallback, we'll just print it again prominently
        print("=" * 40)
        print(f"!!! REMINDER (Notification Failed) !!!")
        print(f">>> {message}")
        print("=" * 40)

# Initialize our scheduler (this part remains the same)
scheduler = BackgroundScheduler()
scheduler.start()