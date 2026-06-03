import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from services.twilio_service import initiate_call

if __name__ == "__main__":
    TO_NUMBER = "+919850509898"  # Replace with your verified number
    USER_NAME = "Nitesh"

    print(f"Calling {TO_NUMBER}...")
    call_sid = initiate_call(to_number=TO_NUMBER, user_name=USER_NAME)
    print(f"Call SID: {call_sid}")
    print("Your phone should ring now!")
