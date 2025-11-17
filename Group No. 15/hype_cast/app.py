from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import pickle
import numpy as np
import os

# ========== APP SETUP ==========
app = Flask(__name__)
CORS(app)

# File paths - use environment variables or relative paths
DATASET_PATH = os.getenv(
    'DATASET_PATH',
    r"C:\Users\Dhruvraj\Documents\hype_cast\Backend\Datasets\Artist_Dataset.txt"
)
MODEL_PATH = os.getenv(
    'MODEL_PATH',
    r"C:\Users\Dhruvraj\Documents\hype_cast\Backend\artist_model.pkl"
)

# ========== LOAD DATA ==========
try:
    df = pd.read_csv(DATASET_PATH, delimiter=",")
    df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")
    print("✅ Successfully loaded artist dataset")
    print(f"Dataset shape: {df.shape}")
    print(f"Columns: {list(df.columns)}")
    print(f"Sample data:\n{df.head(2)}")
except Exception as e:
    print(f"❌ Failed to load dataset: {e}")
    df = pd.DataFrame()

# ========== LOAD MODEL ==========
artist_model = None
model_scaler = None
model_features = None

try:
    with open(MODEL_PATH, "rb") as file:
        model_data = pickle.load(file)
        artist_model = model_data.get('model')
        model_scaler = model_data.get('scaler')
        model_features = model_data.get('features', ['average_ticket_price', 'total_spotify_streams'])
    print("✅ Model loaded successfully")
    print(f"Model type: {type(artist_model).__name__}")
    print(f"Scaler type: {type(model_scaler).__name__}")
    print(f"Model features: {model_features}")
except Exception as e:
    print(f"❌ Failed to load model: {e}")

# ========== HELPER FUNCTIONS ==========
def get_request_data():
    """Safely get JSON or form data"""
    if request.is_json:
        return request.get_json()
    else:
        return request.form.to_dict()


def safe_mean(series, default=0):
    """Calculate mean safely, handling empty series and NaN values"""
    if series.empty:
        return default
    mean_val = series.mean()
    return mean_val if not pd.isna(mean_val) else default


def calculate_total_streams(artist_data):
    """Calculate total Spotify streams from all regions with debugging"""
    spotify_columns = [col for col in artist_data.columns if 'spotify_streams' in col.lower() or 'streams' in col.lower()]
    
    print(f"🔍 Looking for Spotify columns... Found: {spotify_columns}")
    
    if not spotify_columns:
        # Try alternative column names
        alternative_columns = [col for col in artist_data.columns if 'stream' in col.lower()]
        print(f"🔍 Trying alternative columns: {alternative_columns}")
        spotify_columns = alternative_columns
    
    if not spotify_columns:
        print("❌ No Spotify streams columns found in dataset!")
        return 0
    
    # Calculate total streams
    try:
        total_streams_series = artist_data[spotify_columns].sum(axis=1, skipna=True)
        avg_total_streams = total_streams_series.mean()
        
        print(f"🔍 Individual show streams: {total_streams_series.tolist()}")
        print(f"🔍 Average total streams: {avg_total_streams}")
        
        return avg_total_streams
    except Exception as e:
        print(f"❌ Error calculating streams: {e}")
        return 0


def predict_with_model(ticket_price, total_streams):
    """Safe wrapper for model prediction with proper validation and debugging"""
    if not artist_model or not model_scaler:
        error_msg = "Model or scaler not available"
        print(f"❌ {error_msg}")
        return {"value": None, "error": error_msg, "status": "failed"}

    try:
        # Validate inputs
        print(f"🔍 Prediction inputs - Ticket: ${ticket_price}, Streams: {total_streams:,.0f}")
        
        if any(pd.isna(x) or x is None or x <= 0 for x in [ticket_price, total_streams]):
            error_msg = f"Invalid input values for prediction: ticket_price={ticket_price}, total_streams={total_streams}"
            print(f"❌ {error_msg}")
            return {"value": None, "error": error_msg, "status": "failed"}

        # Prepare features
        features = np.array([[ticket_price, total_streams]])
        print(f"🔍 Features before scaling: {features}")

        # Scale features
        features_scaled = model_scaler.transform(features)
        print(f"🔍 Features after scaling: {features_scaled}")

        # Make prediction
        prediction = artist_model.predict(features_scaled)
        prediction_value = float(prediction[0])
        
        print(f"🔍 Raw prediction: {prediction}")
        print(f"✅ Final prediction value: {prediction_value}")
        
        return {"value": prediction_value, "error": None, "status": "success"}

    except Exception as e:
        error_msg = f"Prediction error: {str(e)}"
        print(f"❌ {error_msg}")
        return {"value": None, "error": error_msg, "status": "failed"}


def get_artist_data(artist_name, city=None):
    """Get artist data with proper filtering and validation"""
    if df.empty:
        return None, "Dataset not loaded"

    artist_name = artist_name.strip().lower()
    artist_data = df[df["artist"].str.lower() == artist_name]

    if artist_data.empty:
        return None, f"Artist '{artist_name.title()}' not found in dataset"

    print(f"🔍 Found {len(artist_data)} records for artist: {artist_name}")

    if city:
        city = city.strip().lower()
        city_data = artist_data[artist_data["city"].str.lower() == city]
        if not city_data.empty:
            print(f"🔍 Found {len(city_data)} records for city: {city}")
            return city_data, None
        else:
            print(f"⚠️ No shows found in {city}, using all artist data")
            return artist_data, f"No shows found in {city.title()}, using all artist data"

    return artist_data, None


# ========== DEBUG ENDPOINTS ==========
@app.route("/debug/model", methods=["GET"])
def debug_model():
    """Debug endpoint to check model status"""
    model_info = {
        "model_loaded": artist_model is not None,
        "scaler_loaded": model_scaler is not None,
        "model_features": model_features,
        "model_type": type(artist_model).__name__ if artist_model else None,
        "scaler_type": type(model_scaler).__name__ if model_scaler else None
    }
    
    # Test prediction with sample data
    if artist_model and model_scaler:
        test_inputs = [
            [100, 1000000],
            [200, 5000000], 
            [500, 10000000]
        ]
        
        test_results = []
        for inp in test_inputs:
            try:
                scaled = model_scaler.transform([inp])
                prediction = artist_model.predict(scaled)
                test_results.append({
                    "input": inp,
                    "scaled": scaled.tolist(),
                    "prediction": float(prediction[0])
                })
            except Exception as e:
                test_results.append({"input": inp, "error": str(e)})
        
        model_info["test_predictions"] = test_results
    
    return jsonify(model_info)


@app.route("/debug/data", methods=["GET"])
def debug_data():
    """Check data distribution"""
    if df.empty:
        return jsonify({"error": "No data loaded"})
    
    stats = {
        "total_artists": df["artist"].nunique(),
        "total_records": len(df),
        "available_columns": list(df.columns),
        "ticket_price_stats": df["average_ticket_price"].describe().to_dict() if "average_ticket_price" in df.columns else "Column not found",
    }
    
    # Calculate streams if columns exist
    spotify_cols = [col for col in df.columns if 'spotify' in col.lower() or 'stream' in col.lower()]
    if spotify_cols:
        df['total_streams_calc'] = df[spotify_cols].sum(axis=1)
        stats["total_streams_stats"] = df['total_streams_calc'].describe().to_dict()
        stats["spotify_columns_used"] = spotify_cols
    else:
        stats["spotify_columns"] = "No Spotify/stream columns found"
    
    # Sample artist data
    sample_artists = df["artist"].unique()[:5] if "artist" in df.columns else []
    stats["sample_artists"] = list(sample_artists)
    
    return jsonify(stats)


@app.route("/debug/artist/<artist_name>", methods=["GET"])
def debug_artist(artist_name):
    """Debug specific artist data"""
    if df.empty:
        return jsonify({"error": "No data loaded"})
    
    artist_data = df[df["artist"].str.lower() == artist_name.lower()]
    
    if artist_data.empty:
        return jsonify({"error": f"Artist '{artist_name}' not found"})
    
    result = {
        "artist": artist_name,
        "total_shows": len(artist_data),
        "data_columns": list(artist_data.columns),
        "sample_records": artist_data.head(3).to_dict('records')
    }
    
    # Calculate streams
    spotify_cols = [col for col in artist_data.columns if 'spotify' in col.lower() or 'stream' in col.lower()]
    if spotify_cols:
        total_streams = artist_data[spotify_cols].sum(axis=1, skipna=True)
        result["streams_calculation"] = {
            "columns_used": spotify_cols,
            "streams_per_show": total_streams.tolist(),
            "average_streams": total_streams.mean()
        }
    
    return jsonify(result)

# ========== MAIN ENDPOINTS ==========
@app.route("/")
def home():
    return jsonify({
        "status": "API is running",
        "endpoints": {
            "/agent": "POST - Analyze feasibility of booking an artist",
            "/attendee": "POST - Analyze hype & worthiness of attending a show",
            "/debug/model": "GET - Check model status",
            "/debug/data": "GET - Check dataset statistics",
            "/debug/artist/<name>": "GET - Check specific artist data"
        },
        "dataset_loaded": not df.empty,
        "dataset_size": len(df) if not df.empty else 0,
        "model_loaded": artist_model is not None,
        "scaler_loaded": model_scaler is not None
    })


@app.route("/agent", methods=["POST"])
def agent_analysis():
    try:
        data = get_request_data()
        artist = data.get("artistName", "").strip()
        city = data.get("city", "").strip()

        print(f"🎯 Agent analysis request - Artist: {artist}, City: {city}")

        # Validate required fields
        if not artist:
            return jsonify({"error": "Artist name is required", "status": "error"}), 400

        # Get artist data
        artist_data, warning = get_artist_data(artist, city if city else None)
        if artist_data is None:
            return jsonify({"error": warning, "status": "error"}), 404

        # Validate ticket price
        try:
            ticket_price = float(data.get("ticketPrice", 0))
            if ticket_price <= 0:
                return jsonify({"error": "Ticket price must be positive", "status": "error"}), 400
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid ticket price", "status": "error"}), 400

        # Calculate metrics
        avg_cost = safe_mean(artist_data["production_cost_estimation"], 1000000)
        avg_attendance = safe_mean(artist_data["total_attendees"], 5000)
        total_streams = calculate_total_streams(artist_data)
        roi = safe_mean(artist_data["roi_(%)"], 0)
        show_count = len(artist_data)

        print(f"📊 Calculated metrics - Cost: ${avg_cost:,.0f}, Attendance: {avg_attendance:,.0f}, Streams: {total_streams:,.0f}")

        # Feasibility scoring
        score = 0
        if ticket_price >= 100:
            score += 20
        if avg_cost <= 2000000:
            score += 30
        if avg_attendance >= 8000:
            score += 30
        if roi >= 15:
            score += 20

        feasibility = (
            "✅ Highly feasible" if score >= 80 else
            "✅ Feasible" if score >= 60 else
            "⚠️ Marginally feasible" if score >= 40 else
            "❌ Not feasible"
        )

        venue_status = (
            "✅ Good match" if avg_attendance > 10000 else
            "⚠️ Consider smaller venue" if avg_attendance > 5000 else
            "❌ Venue too large"
        )

        # Model prediction
        prediction_result = predict_with_model(ticket_price, total_streams)

        response = {
            "status": "success",
            "artist": artist.title(),
            "city": city.title() if city else "All cities",
            "feasibility": feasibility,
            "feasibility_score": score,
            "avg_cost": round(avg_cost),
            "avg_attendance": int(avg_attendance),
            "total_streams": int(total_streams),
            "roi": round(roi, 1),
            "venue_status": venue_status,
            "shows_analyzed": show_count,
            "prediction": prediction_result
        }

        if warning:
            response["warning"] = warning

        print(f"✅ Agent analysis completed for {artist}")
        return jsonify(response)

    except Exception as e:
        print(f"❌ Agent analysis error: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}", "status": "error"}), 500


@app.route("/attendee", methods=["POST"])
def attendee_analysis():
    try:
        data = get_request_data()
        artist = data.get("artistName", "").strip()

        print(f"🎯 Attendee analysis request - Artist: {artist}")

        if not artist:
            return jsonify({"error": "Artist name is required", "status": "error"}), 400

        # Get artist data
        artist_data, warning = get_artist_data(artist)
        if artist_data is None:
            return jsonify({"error": warning, "status": "error"}), 404

        # Validate ticket price
        try:
            ticket_price = float(data.get("ticketPrice", 0))
            if ticket_price <= 0:
                return jsonify({"error": "Ticket price must be positive", "status": "error"}), 400
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid ticket price", "status": "error"}), 400

        # Calculate metrics
        avg_attendance = safe_mean(artist_data["total_attendees"], 5000)
        total_streams = calculate_total_streams(artist_data)
        show_count = len(artist_data)

        print(f"📊 Calculated metrics - Attendance: {avg_attendance:,.0f}, Streams: {total_streams:,.0f}")

        # Hype scoring
        hype_score = (avg_attendance * 0.4) + ((total_streams / 1_000_000) * 0.6)

        if hype_score > 20000 and ticket_price <= 200:
            recommendation = "🔥 Must attend - Great value!"
        elif hype_score > 15000 and ticket_price <= 300:
            recommendation = "✅ Worth attending - Good deal"
        elif hype_score > 10000 and ticket_price <= 400:
            recommendation = "🤔 Consider attending - Fair price"
        else:
            recommendation = "❌ Might skip - Poor value"

        # Model prediction
        prediction_result = predict_with_model(ticket_price, total_streams)

        response = {
            "status": "success",
            "artist": artist.title(),
            "recommendation": recommendation,
            "hype_score": round(hype_score, 1),
            "total_streams": int(total_streams),
            "avg_attendance": int(avg_attendance),
            "ticket_price": ticket_price,
            "shows_analyzed": show_count,
            "prediction": prediction_result
        }

        if warning:
            response["warning"] = warning

        print(f"✅ Attendee analysis completed for {artist}")
        return jsonify(response)

    except Exception as e:
        print(f"❌ Attendee analysis error: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}", "status": "error"}), 500


# ========== MAIN ==========
if __name__ == "__main__":
    print("🚀 Starting HypeCast API Server...")
    print(f"📊 Dataset loaded: {not df.empty}")
    print(f"🤖 Model loaded: {artist_model is not None}")
    print(f"🔧 Scaler loaded: {model_scaler is not None}")
    app.run(debug=True, port=5000, host="0.0.0.0")