# Running the RakshAI Baseline in Google Colab

Follow these steps to run the reproducible baseline model in Google Colab:

1. **Open Google Colab:**
   - Navigate to [colab.research.google.com](https://colab.research.google.com).
   - Click **File > Upload Notebook** and select `rakshai_baseline.ipynb`.

2. **Upload Dataset:**
   - In the Colab left sidebar, click the **Folder icon (Files)**.
   - Click the **Upload** icon and select `rakshai_privacy_safe_dataset.csv`.

3. **Execute the Experiment:**
   - Click **Runtime > Run all** (or press `Ctrl+F9`).
   - The notebook will validate the dataset, run 5-Fold `GroupKFold` on `donor_group_id`, fit preprocessors in-fold, and generate comparative metric tables against the 90.3% majority baseline.

4. **Security & Privacy:**
   - The dataset contains zero direct identifiers, no phone numbers, no exact GPS coordinates, and no leaking rule comments.
   - User grouping relies solely on pseudonymous group keys (`donor_group_id`).
