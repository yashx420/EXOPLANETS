/*
  # Create Predictions Table for Exoplanet Detection System

  ## Overview
  This migration creates the core database schema for storing exoplanet detection predictions
  from the NASA-esque neural network classifier.

  ## 1. New Tables

  ### `predictions`
  Stores all prediction results from the TensorFlow model
  - `id` (uuid, primary key) - Unique identifier for each prediction
  - `is_exoplanet` (boolean, required) - Classification result (true = exoplanet detected)
  - `confidence` (numeric, required) - Model confidence score (0.0 to 1.0)
  - `flux_data` (jsonb, optional) - Sample of light curve flux values (first 100 points)
  - `created_at` (timestamptz, required) - Timestamp of prediction
  - `user_session` (text, optional) - Session identifier for tracking user predictions

  ## 2. Security

  ### Row Level Security (RLS)
  - Enable RLS on `predictions` table for secure data access
  - Allow anonymous users to read all predictions (public data)
  - Allow anonymous users to insert their own predictions
  - Restrict updates and deletes to prevent data tampering

  ### Policies
  - `"Anyone can view predictions"` - Public read access for analytics display
  - `"Anyone can insert predictions"` - Allow anonymous submissions for research data
  - No update or delete policies - predictions are immutable once created

  ## 3. Indexes
  - Index on `created_at` for efficient time-based queries
  - Index on `is_exoplanet` for quick filtering of positive detections

  ## 4. Important Notes
  - Predictions are treated as immutable research data
  - No personally identifiable information is stored
  - All timestamps use UTC timezone
  - Flux data is stored as JSONB for flexible querying
*/

CREATE TABLE IF NOT EXISTS predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_exoplanet boolean NOT NULL,
  confidence numeric(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  flux_data jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_session text
);

ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view predictions"
  ON predictions
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert predictions"
  ON predictions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON predictions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_is_exoplanet ON predictions(is_exoplanet);
CREATE INDEX IF NOT EXISTS idx_predictions_confidence ON predictions(confidence DESC);