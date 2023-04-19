import { useCallback, useEffect, useState, useMemo } from 'react'
import {
  mergeDefaultIntoUserBranch,
  checkMergeDefaultIntoUserBranch,
  checkMergeUserIntoDefaultBranch,
  mergeUserIntoDefaultBranch
} from "dcs-branch-merger"

const defaultStatus = {
  "mergeNeeded": false,
  "conflict": false,
  "success": false,
  "userBranchDeleted": false,
  "error": false,
  "message": "",
  "pullRequest": "",
}

const update = (params) => { console.log("running mergeDefaultIntoUserBranch"); return mergeDefaultIntoUserBranch(params) }

const checkUpdate = (params) => { console.log("running checkMergeDefaultIntoUserBranch"); return checkMergeDefaultIntoUserBranch(params) }

const checkMerge = (params) => { console.log("running checkMergeUserIntoDefaultBranch"); return checkMergeUserIntoDefaultBranch(params) }

const merge = (params) => { console.log("running mergeUserIntoDefaultBranch"); return mergeUserIntoDefaultBranch(params) }

export default function useBranchMerger({ server, owner, repo, userBranch, tokenid }) {

  /**
   * Legend:
   * merge = push from user branch to master branch
   * update = pull from master branch to user branch
   **/

  const [mergeStatus, setMergeStatus] = useState(defaultStatus);
  const [updateStatus, setUpdateStatus] = useState(defaultStatus);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [loadingMerge, setLoadingMerge] = useState(false);

  const params = useMemo(() => ({ server, owner, repo, userBranch, tokenid }), [server, owner, repo, userBranch, tokenid])

  const setStatus = useCallback((setter, newStatus) => setter( prevStatus => {
    if (Object.keys(prevStatus).some(key => prevStatus[key] !== newStatus[key])) return {...prevStatus, ...newStatus};
    return prevStatus;
  }), [])

  const isInvalid =  useCallback((setter, {server, owner, repo, userBranch, tokenid}) => {
    if (![server, owner, repo, userBranch, tokenid].every(Boolean))  {
      setStatus(setter, defaultStatus);
      return Promise.resolve(defaultStatus);
    };
  }, [setStatus])

  const runMergeHandler = useCallback(async ({setter,handler,params}) => isInvalid(setter, params) ?? handler(params)
  .then((newStatus) => {
    setStatus(setter, newStatus)
    return newStatus
  }).catch(e => {
    const newStatus = {...defaultStatus, error:true, message: e.message}
    setStatus(setter, newStatus)
    return newStatus
  }),[isInvalid,setStatus]);

  console.log({ mergeStatus, updateStatus });

  /**
   * updates the updateStatus state
   */
  const checkUpdateStatus = useCallback(() => {
    setLoadingUpdate(true);
    const setter = setUpdateStatus;
    const handler = checkUpdate
    return runMergeHandler({setter,handler,params}).then(r => { setLoadingUpdate(false);  return r})
  },[params,runMergeHandler])

  /**
   * pulls master branch from user branch
   */
  const updateUserBranch = useCallback(() => {
    setLoadingUpdate(true);
    const setter = setUpdateStatus;
    const handler = update;
    return runMergeHandler({setter,handler,params}).then(r => { setLoadingUpdate(false);  return r})
  },[params,runMergeHandler]);

   /**
   * updates the mergeStatus state
   */
  const checkMergeStatus = useCallback(() => {
    setLoadingMerge(true);
    const setter = setMergeStatus;
    const handler = checkMerge;
    return runMergeHandler({setter,handler,params}).then(r => { setLoadingMerge(false);  return r})
  }, [params,runMergeHandler])

  /**
   * pushes user branch to master branch
   */
  const mergeMasterBranch = useCallback((prDescription) => {
    setLoadingMerge(true);
    const setter = setMergeStatus;
    const handler = merge;
    return runMergeHandler({ setter, handler, params: { ...params, prDescription } }).then(r => {
      setLoadingMerge(false);
      return r
    })
  },[params,runMergeHandler]);

  useEffect(() => {
    checkMergeStatus();
  }, [checkMergeStatus])
  
  useEffect(() => {
    checkUpdateStatus();
  }, [checkUpdateStatus])

  return {
    state: {
      mergeStatus,
      updateStatus,
      loadingUpdate,
      loadingMerge
    }, actions: {
      checkUpdateStatus,
      checkMergeStatus,
      updateUserBranch,
      mergeMasterBranch
    }
  }
}
