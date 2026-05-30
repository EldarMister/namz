const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

function toAndroidRawFileName(soundPath) {
  const parsed = path.parse(soundPath);
  const name = parsed.name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  return `${name}${parsed.ext.toLowerCase()}`;
}

module.exports = function withAndroidRawSounds(config, props = {}) {
  const sounds = props.sounds || [];

  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const projectRoot = modConfig.modRequest.projectRoot;
      const rawDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res', 'raw');

      fs.mkdirSync(rawDir, { recursive: true });

      sounds.forEach((sound) => {
        const source = path.resolve(projectRoot, sound);
        const destination = path.join(rawDir, toAndroidRawFileName(sound));

        if (!fs.existsSync(source)) {
          throw new Error(`Android raw sound file was not found: ${source}`);
        }

        fs.copyFileSync(source, destination);
      });

      return modConfig;
    },
  ]);
};
