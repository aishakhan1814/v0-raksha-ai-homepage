import sys
sys.path.insert(0, r'C:\Users\Alfalima\.gemini\antigravity\brain\d5930cd4-8cfa-4704-8676-4efae36366e1\scratch\lib')

import numpy as np
import pandas as pd
from sklearn.model_selection import GroupKFold
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.metrics import (
    precision_score, recall_score, f1_score,
    balanced_accuracy_score, average_precision_score, roc_auc_score,
    confusion_matrix
)
from xgboost import XGBClassifier

# 1. Load data
data_path = 'rakshai_privacy_safe_dataset.csv'
df = pd.read_csv(data_path)
print(f"Loaded dataset: {df.shape[0]} rows, {df.shape[1]} columns")

core_num = ['cycle_of_donations', 'frequency_in_days', 'registration_days']
core_cat = ['role', 'blood_group', 'gender', 'donor_type', 'eligibility_status']
feature_cols = core_num + core_cat

# For binary classification where Inactive is the positive class (1):
# In raw dataset: target_active=1 (Active: 6351), target_active=0 (Inactive: 682)
# Let y_binary = 1 for Inactive, 0 for Active:
y_inactive = (df['target_active'] == 0).astype(int).values
groups = df['donor_group_id'].values

# scale_pos_weight = count(negative) / count(positive) = 6351 / 682 = 9.312
scale_pos_weight = (y_inactive == 0).sum() / (y_inactive == 1).sum()
print(f"Calculated scale_pos_weight: {scale_pos_weight:.3f}")

# 2. Preprocessing builder
def build_preprocessor():
    num_pipe = Pipeline([
        ('imp', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    cat_pipe = Pipeline([
        ('imp', SimpleImputer(strategy='constant', fill_value='missing')),
        ('ohe', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])
    return ColumnTransformer([
        ('num', num_pipe, core_num),
        ('cat', cat_pipe, core_cat)
    ])

# 3. Outer GroupKFold validation with inner grouped hyperparameter tuning
outer_gkf = GroupKFold(n_splits=5)

# Hyperparameter candidates for inner search
param_candidates = [
    {'max_depth': 3, 'learning_rate': 0.05, 'n_estimators': 100, 'subsample': 0.8, 'colsample_bytree': 0.8, 'reg_lambda': 2.0},
    {'max_depth': 4, 'learning_rate': 0.03, 'n_estimators': 120, 'subsample': 0.8, 'colsample_bytree': 0.8, 'reg_lambda': 5.0},
    {'max_depth': 3, 'learning_rate': 0.08, 'n_estimators': 80,  'subsample': 0.9, 'colsample_bytree': 0.9, 'reg_lambda': 1.0},
    {'max_depth': 4, 'learning_rate': 0.05, 'n_estimators': 100, 'subsample': 0.9, 'colsample_bytree': 0.8, 'reg_lambda': 3.0},
]

outer_records = []
oof_preds = np.zeros(len(y_inactive))
oof_probs = np.zeros(len(y_inactive))

for fold, (train_idx, test_idx) in enumerate(outer_gkf.split(df[feature_cols], y_inactive, groups)):
    print(f"\n--- Outer Fold {fold + 1} / 5 ---")
    X_train_df, X_test_df = df[feature_cols].iloc[train_idx], df[feature_cols].iloc[test_idx]
    y_train, y_test = y_inactive[train_idx], y_inactive[test_idx]
    groups_train = groups[train_idx]
    
    # Inner GroupKFold for hyperparameter tuning
    inner_gkf = GroupKFold(n_splits=3)
    best_params = None
    best_inner_score = -1.0
    
    for params in param_candidates:
        inner_pr_aucs = []
        for in_tr_idx, in_val_idx in inner_gkf.split(X_train_df, y_train, groups_train):
            X_in_tr, X_in_val = X_train_df.iloc[in_tr_idx], X_train_df.iloc[in_val_idx]
            y_in_tr, y_in_val = y_train[in_tr_idx], y_train[in_val_idx]
            
            prep = build_preprocessor()
            X_in_tr_proc = prep.fit_transform(X_in_tr)
            X_in_val_proc = prep.transform(X_in_val)
            
            clf = XGBClassifier(
                **params,
                scale_pos_weight=scale_pos_weight,
                random_state=42 + fold,
                eval_metric='logloss',
                verbosity=0
            )
            clf.fit(X_in_tr_proc, y_in_tr)
            probs_in_val = clf.predict_proba(X_in_val_proc)[:, 1] # P(Inactive)
            pr_auc = average_precision_score(y_in_val, probs_in_val)
            inner_pr_aucs.append(pr_auc)
            
        mean_inner = np.mean(inner_pr_aucs)
        if mean_inner > best_inner_score:
            best_inner_score = mean_inner
            best_params = params
            
    print(f"Fold {fold + 1} Best Inner PR-AUC: {best_inner_score:.4f} with params: {best_params}")
    
    # Fit selected model on entire outer training fold
    outer_prep = build_preprocessor()
    X_train_proc = outer_prep.fit_transform(X_train_df)
    X_test_proc = outer_prep.transform(X_test_df)
    
    best_clf = XGBClassifier(
        **best_params,
        scale_pos_weight=scale_pos_weight,
        random_state=42 + fold,
        eval_metric='logloss',
        verbosity=0
    )
    best_clf.fit(X_train_proc, y_train)
    
    # Evaluate on outer test fold
    test_probs = best_clf.predict_proba(X_test_proc)[:, 1] # Probability of Inactive
    test_preds = (test_probs >= 0.5).astype(int)
    
    oof_preds[test_idx] = test_preds
    oof_probs[test_idx] = test_probs
    
    # Inactive class is 1
    inact_prec = precision_score(y_test, test_preds, pos_label=1, zero_division=0)
    inact_rec = recall_score(y_test, test_preds, pos_label=1, zero_division=0)
    inact_f1 = f1_score(y_test, test_preds, pos_label=1, zero_division=0)
    mac_f1 = f1_score(y_test, test_preds, average='macro', zero_division=0)
    bal_acc = balanced_accuracy_score(y_test, test_preds)
    pr_auc = average_precision_score(y_test, test_probs)
    roc_auc = roc_auc_score(y_test, test_probs)
    
    outer_records.append({
        'experiment': 'XGBoost (Tuned)',
        'fold': fold + 1,
        'inactive_precision': inact_prec,
        'inactive_recall': inact_rec,
        'inactive_f1': inact_f1,
        'macro_f1': mac_f1,
        'balanced_accuracy': bal_acc,
        'pr_auc': pr_auc,
        'roc_auc': roc_auc,
        'best_params': str(best_params)
    })
    print(f"Fold {fold + 1} Test Results -> Inact F1: {inact_f1:.4f}, Inact Recall: {inact_rec:.4f}, PR-AUC: {pr_auc:.4f}")

df_results = pd.DataFrame(outer_records)

# Save to CSV
results_csv_path = 'xgboost_execution_results.csv'
df_results.to_csv(results_csv_path, index=False)
df_results.to_csv(r'C:\Users\Alfalima\.gemini\antigravity\brain\d5930cd4-8cfa-4704-8676-4efae36366e1\scratch\xgboost_execution_results.csv', index=False)
print("\nResults saved to xgboost_execution_results.csv")

# Print overall metrics
print("\n=== XGBOOST 5-FOLD CV SUMMARY (MEAN +- STD) ===")
summary = df_results.agg({
    'inactive_precision': ['mean', 'std'],
    'inactive_recall': ['mean', 'std'],
    'inactive_f1': ['mean', 'std'],
    'macro_f1': ['mean', 'std'],
    'balanced_accuracy': ['mean', 'std'],
    'pr_auc': ['mean', 'std']
})
print(summary.to_string())

# Confusion Matrix across all out-of-fold predictions
cm = confusion_matrix(y_inactive, oof_preds)
print("\n=== OVERALL OUT-OF-FOLD CONFUSION MATRIX ===")
print("                   Predicted Active (0)    Predicted Inactive (1)")
print(f"Actual Active   (0):       {cm[0, 0]:<20}    {cm[0, 1]}")
print(f"Actual Inactive (1):       {cm[1, 0]:<20}    {cm[1, 1]}")
