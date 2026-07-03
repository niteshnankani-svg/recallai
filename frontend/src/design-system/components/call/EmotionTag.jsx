import React from 'react';

const emotionColor = {
  joy: 'var(--emotion-joy)', sadness: 'var(--emotion-sadness)',
  anxiety: 'var(--emotion-anxiety)', anger: 'var(--emotion-anger)', neutral: 'var(--emotion-neutral)',
};
const emotionSoft = {
  joy: 'var(--emotion-joy-soft)', sadness: 'var(--emotion-sadness-soft)',
  anxiety: 'var(--emotion-anxiety-soft)', anger: 'var(--emotion-anger-soft)', neutral: 'var(--emotion-neutral-soft)',
};

/** EmotionTag — small pill for the detected wellness_category (emotion/detector.py). */
export function EmotionTag({ emotion = 'neutral' }) {
  return (
    <span style={{
      display: 'inline-block', padding: '4px 12px', borderRadius: 'var(--radius-full)',
      background: emotionSoft[emotion] || emotionSoft.neutral, color: emotionColor[emotion] || emotionColor.neutral,
      font: 'var(--text-label)', letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase',
      fontFamily: 'var(--font-body)',
    }}>
      {emotion}
    </span>
  );
}
