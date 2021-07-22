//import languagesJSON from './languages.json';

export const getLanguage = ({ languageId, languagesJSON }) => {
  let _language;
  const language = languagesJSON.filter(object => object.lc === languageId)[0];
  _language = formatLanguage({ language });
  return _language;
};

export const getLanguageName = ({ languageId, languagesJSON }) => {
  const language = getLanguage({ languageId, languagesJSON });
  const languageName = language ? language.ln : null;
  return languageName;
};

/*
export const getLanguages = ({ languagesJSON }) => {
  const _languages = languagesJSON
    .map(language => formatLanguage({ language }));
  return _languages;
};

export const getGatewayLanguages = () => {
  const _languages = languagesJSON
    .filter(language => language.gw)
    .map(language => formatLanguage({ language }));
  return _languages;
}
*/

export const formatLanguage = ({ language }) => {
  let _language = {};
  if (language) {
    _language = {
      id: language.pk,
      languageId: language.lc,
      languageName: language.ang,
      region: language.lr,
      gateway: language.gw,
      country: language.hc,
      localized: language.ln,
      direction: language.ld,
      aliases: language.alt,
      countries: language.cc,
    };
  }
  return _language;
};

//export const languages = getLanguages();
//export const gatewayLanguages = getGatewayLanguages();