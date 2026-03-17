// Returns a looping HTMLAudioElement ready to play.
// Must be called after a user gesture to satisfy browser autoplay policy.
export const createAmbientAudio = () => {
  const audio  = new Audio('/office.mp3');
  audio.loop   = true;
  audio.volume = 0.4;
  return audio;
};
