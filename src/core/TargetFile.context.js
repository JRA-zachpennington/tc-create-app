import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useFile, FileContext } from 'gitea-react-toolkit';
import {useEffect} from 'react';
import { AppContext } from '../App.context';

const TargetFileContext = React.createContext();

function TargetFileContextProvider({
  validated, onValidated, onCriticalErrors, children
}) {
  const {
    state: {
      authentication, targetRepository, filepath, setFilepath,
    } = {},
  } = useContext(AppContext);

  const { state: sourceFile } = useContext(FileContext);

  const fake_onopen_validator = () => {console.log("FAKE!!")}

  const {
    state, actions, component, components, config,
  } = useFile({
    config: (authentication && authentication.config),
    authentication,
    repository: targetRepository,
    filepath,
    onFilepath: setFilepath,
    defaultContent: (sourceFile && sourceFile.content),
    onOpenValidation: fake_onopen_validator,
  });


  useEffect(() => {
    if (state === undefined || state.content === undefined) {
      onValidated(false);
      //onCriticalErrors(['Validating...']);
    } else if (!validated) {
      // work with both old and new TN TSV formats
      if ( state.name.match(/^tn_...\.tsv$|tn_..-...\.tsv$|^twl_...\.tsv$/) ) {
        const link = state.html_url.replace('/src/', '/blame/');
        let criticalNotices = [];
        let tsvFile = state.content;
        // Split into an array of rows
        let rows = tsvFile.split('\n');
        // Is the first row correct (must have the correct headers)
        let tsvHeader = "Book\tChapter\tVerse\tID\tSupportReference\tOrigQuote\tOccurrence\tGLQuote\tOccurrenceNote";
        const tsvHeader7= "Reference\tID\tTags\tSupportReference\tQuote\tOccurrence\tAnnotation";
        const tsvHeader6= "Reference\tID\tTags\tOrigWords\tOccurrence\tTWLink";
        const tsvFormat = rows[0].split('\t').length;
        if ( tsvFormat === 7 ) {
          tsvHeader = tsvHeader7;
        } else if ( tsvFormat === 6 ) {
          tsvHeader = tsvHeader6;
        } else if ( tsvFormat === 9 ) {
          // good to go... must be either 7 or 9
        } else {
          criticalNotices.push([
            `${link}#L1`,
            '1',
            `Bad TSV Header, must have 7 or 9 columns`]);
        }
        // NOTE: there are cases where invisible characters are at the end 
        // of the row. This line ensures that the header row only has the
        // number of characters needed. Only then are they compared.
        rows[0] = rows[0].slice(0,tsvHeader.length);
        if (tsvHeader !== rows[0]) {
          criticalNotices.push([
            `${link}#L1`,
            '1',
            `Bad TSV Header, expecting "${tsvHeader.replaceAll('\t', ', ')}"`]);
        }
  
        if (rows.length > 1) {
          for (let i = 1; i < rows.length; i++) {
            let line = i + 1;
            // ignore, skip empty rows
            if ( rows[i] === undefined || rows[i] === '' ) {
              continue;
            }
            let cols = rows[i].split('\t');
            if (cols.length < tsvFormat) {
              criticalNotices.push([
                `${link}#L${line}`,
                `${line}`,
                `Not enough columns, expecting ${tsvFormat}, found ${cols.length}`
              ])
            } else if (cols.length > 9) {
              criticalNotices.push([
                `${link}#L${line}`,
                `${line}`,
                `Too many columns, expecting ${tsvFormat}, found ${cols.length}`
              ])
            }
          }
        }
  
        if (criticalNotices.length > 0) {
          onCriticalErrors(criticalNotices);
        } else {
          onValidated(true);
        }
      } else {
        onValidated(true)
      }
    }
  }, [validated, onValidated, state, onCriticalErrors]);

  const context = {
    state: { ...state, validated }, // state true/false
    actions: { ...actions }, 
    component,
    components,
    config,
  };


  return (
    <TargetFileContext.Provider value={context}>
      {children}
    </TargetFileContext.Provider>
  );
};

TargetFileContextProvider.propTypes = {
  /** Children to render inside of Provider */
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
};

export {
  TargetFileContextProvider,
  TargetFileContext,
};
