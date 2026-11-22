# RakshAI — Baseline vs. XGBoost Performance Comparison Report

## 1. Executive Summary
Using identical 5-fold outer `GroupKFold` splits on `donor_group_id` with in-fold `ColumnTransformer` preprocessing, a regularized `XGBClassifier` with nested inner cross-validation was evaluated against the `LogisticRegression` baseline on the core feature set.

## 2. Quantitative Comparison Table

| Metric | Majority Baseline | Logistic Regression (Core) | XGBoost (Tuned Core) | Net Improvement (XGB vs LogReg) |
|---|---|---|---|---|
| **Inactive Precision** | 0.0000 ± 0.0000 | 0.5116 ± 0.0416 | **0.6826 ± 0.0772** | **+0.1710 (+33.4%)** |
| **Inactive Recall** | 0.0000 ± 0.0000 | **0.9770 ± 0.0160** | 0.9714 ± 0.0235 | -0.0056 (virtually tied) |
| **Inactive F1-Score** | 0.0000 ± 0.0000 | 0.6705 ± 0.0351 | **0.7990 ± 0.0506** | **+0.1285 (+19.2%)** |
| **Macro F1-Score** | 0.4745 ± 0.0010 | 0.8080 ± 0.0219 | **0.8859 ± 0.0297** | **+0.0779 (+9.6%)** |
| **Balanced Accuracy** | 0.5000 ± 0.0000 | 0.9380 ± 0.0077 | **0.9607 ± 0.0087** | **+0.0227 (+2.4%)** |
| **PR-AUC** | 0.0970 ± 0.0036 | 0.6694 ± 0.0830 | **0.8729 ± 0.0135** | **+0.2035 (+30.4%)** |

## 3. Confusion Matrix Analysis (Out-of-Fold)

### Logistic Regression (Core):
- Actual Active (6,351): 5,420 True Negative, 931 False Positive
- Actual Inactive (682): 666 True Positive, 16 False Negative

### XGBoost (Tuned Core):
- Actual Active (6,351): **6,033 True Negative**, **318 False Positive** (False alarms cut by 65.8%!)
- Actual Inactive (682): **662 True Positive**, **20 False Negative** (Maintained 97.1% recall)

## 4. Conclusion
XGBoost achieves a definitive performance improvement over linear Logistic Regression by capturing non-linear interactions between donation intervals, registration tenure, and demographic categories, drastically reducing false alarms while sustaining a 97.1% detection rate for dormant donors.
