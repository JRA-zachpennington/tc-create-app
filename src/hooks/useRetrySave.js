import React, {
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useDeepCompareCallback } from 'use-deep-compare';

import { parseError } from 'gitea-react-toolkit';
import AuthenticationDialog from '../components/dialogs/AuthenticationDialog';
import { AppContext } from '../App.context';

function useRetrySave() {
  const {
    giteaReactToolkit: {
      authenticationHook,
      targetFileHook,
    },
    state,
  } = useContext(AppContext);

  const { save, saveCache } = targetFileHook.actions || {};
  const { html_url } = targetFileHook.state || {};
  const { onLoginFormSubmitLogin } = authenticationHook.actions || {};

  const [savingTargetFileContent, setSavingTargetFileContent] = useState();
  const [doSaveRetry, setDoSaveRetry] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const [showAuthenticationDialog, setShowAuthenticationDialog] = useState(false);

  const openAuthenticationDialog = useCallback(() => {
    setShowAuthenticationDialog(true);
  }, []);

  const closeAuthenticationDialog = useCallback(() => {
    setShowAuthenticationDialog(false);
  }, []);

  useEffect(() => {
    if (saveFailed) {
      alert('Error saving file! File could not be saved.');
    };
  }, [saveFailed]);

  const retrySave = useCallback(async () => {
    try {
      await save(savingTargetFileContent);
    } catch (error) {
      setSaveFailed(true);
    };
    closeAuthenticationDialog();
  }, [save, savingTargetFileContent, closeAuthenticationDialog]);

  useEffect(() => {
    if (doSaveRetry) {
      setDoSaveRetry(false);
      retrySave();
    };
  }, [doSaveRetry, retrySave]);

  const saveTranslation = useDeepCompareCallback(async (content) => {
    setSavingTargetFileContent(content);

    try {
      await save(content);
    } catch (error) {
      const parsedError = parseError({ error });
      const { isRecoverable } = parsedError;

      if (isRecoverable) {
        // assumption is that it is an authentication issue.
        openAuthenticationDialog();
      } else {
        alert("SAVE: " + parsedError.errorMessage);
        setSaveFailed(true);
      };
    };
  }, [save]);

  const autoSaveOnEdit = useCallback(async (content) => {
    if (html_url.includes(state?.targetRepository?.branch)) {
      // We are using a user branch so autosave the cache.
      await saveCache(content);
    }
  }, [saveCache, state, html_url]);

  const saveRetry = useCallback(async ({
    username,
    password,
    remember,
  }) => {
    await onLoginFormSubmitLogin({
      username,
      password,
      remember,
    });
    setDoSaveRetry(true);
  }, [onLoginFormSubmitLogin, setDoSaveRetry]);

  const component = useMemo(() => (
    <AuthenticationDialog
      show={showAuthenticationDialog}
      open={openAuthenticationDialog}
      close={closeAuthenticationDialog}
      saveRetry={saveRetry}
    />
  ), [saveRetry, showAuthenticationDialog, openAuthenticationDialog, closeAuthenticationDialog]);

  return {
    actions: {
      autoSaveOnEdit,
      saveTranslation,
    },
    component,
  };
};

export default useRetrySave;
