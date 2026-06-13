import pickle
import sys

def inspect_scaler(path):
    print(f"--- Inspecting Scaler: {path} ---")
    import joblib
    try:
        scaler = joblib.load(path)
    except Exception as e:
        print("joblib load failed, trying pickle:", e)
        with open(path, 'rb') as f:
            scaler = pickle.load(f)
    print("Type:", type(scaler))
    if hasattr(scaler, 'feature_names_in_'):
        print("Feature Names In (len={}):".format(len(scaler.feature_names_in_)))
        print(list(scaler.feature_names_in_))
    if hasattr(scaler, 'mean_'):
        print("Mean (first 5):", scaler.mean_[:5])
    if hasattr(scaler, 'scale_'):
        print("Scale (first 5):", scaler.scale_[:5])
    return scaler

def inspect_model(path):
    print(f"\n--- Inspecting Model: {path} ---")
    with open(path, 'rb') as f:
        model = pickle.load(f)
    print("Type:", type(model))
    if hasattr(model, 'feature_names_in_'):
        print("Model Feature Names In (len={}):".format(len(model.feature_names_in_)))
    if hasattr(model, 'classes_'):
        print("Classes:", model.classes_)
    if hasattr(model, 'n_features_in_'):
        print("Number of features in:", model.n_features_in_)
    return model

if __name__ == '__main__':
    scaler_path = "/Users/jashwath/Downloads/scaler_raksha.pkl"
    model_path = "/Users/jashwath/Downloads/xgboost_raksha_tuned.pkl"
    try:
        inspect_scaler(scaler_path)
    except Exception as e:
        print("Error inspecting scaler:", e)
        
    try:
        inspect_model(model_path)
    except Exception as e:
        print("Error inspecting model:", e)
