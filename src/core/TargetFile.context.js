import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useFile, FileContext } from 'gitea-react-toolkit';
import { AppContext } from '../App.context';
import { loadFileCache } from '../core/persistence';

const TargetFileContext = React.createContext();

function TargetFileContextProvider({
  onOpenValidation, 
  children
}) {
  const {
    state: {
      authentication, targetRepository, filepath, setFilepath,
    } = {},
  } = useContext(AppContext);

  const { state: sourceFile, stateValues: sourceStateValues, actions: sourceFileActions } = useContext(FileContext) || {};

  const appContext = useContext(AppContext);
  const sourceContext = useContext(FileContext);

  /* Some useful debugging logs left here for the future.
  console.log("--TargetFileContextProvider--");
  console.log("app context:", appContext);
  console.log("source file context:", sourceContext);
  console.log("target repository:",targetRepository);
  console.log("filepath:", filepath);
  */

  let _defaultContent;
  if ( appContext?.state?.sourceRepository?.id === appContext?.state?.targetRepository?.id ) {
    // this is the editor role; they need latest content from master
    // to be on the source side and as the default content 
    // if a new file is being edited.
    //console.log("TargetFile.context() editor mode detected.")
    _defaultContent = sourceFile && sourceFile.content;
  } else {
    // this is the translator role; they require the source side content
    // to be from the published catalog. For now this is latest prod content.
    // it also needs to be the default content.
    //console.log("TargetFile.context() translator mode detected.")
    _defaultContent = sourceContext?.state?.publishedContent;
    // also replease the source content
    sourceFile.content = _defaultContent;
  }

  const targetFileCachedContentFile = loadFileCache();
  console.log("cachedContent");
  console.log(targetFileCachedContentFile);
  
  console.log("defaultContent");
  console.log(sourceFile);

  const {
    state, stateValues, actions, component, components, config,
  } = useFile({
    config: (authentication && authentication.config),
    authentication,
    repository: targetRepository,
    filepath,
    onFilepath: setFilepath,
    loadDefaultCachedContentFile: ()=> loadFileCache(),
    defaultContent: (sourceFile && sourceFile.content),
    onOpenValidation: onOpenValidation,
    // Pass cache actions from the app's FileContext (happens to be SOURCE).
    // Sharing actions allows the app to use onCacheChange events.
    onLoadCache: sourceFileActions.onLoadCache,
    onSaveCache: sourceFileActions.onSaveCache,
    onConfirmClose: null,
  });

  const context = {
    state: { ...state }, 
    stateValues,
    sourceStateValues,
    actions: { ...actions }, 
    component,
    components,
    config,
  };
  //console.log("TargetFile.context() context is:", context);


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
