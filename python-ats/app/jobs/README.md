ATS scoring and resume-to-JD matching are **synchronous HTTP handlers**.

The Node app used Bull/Redis for cold-email dispatch, not for these two features.
No arq/RQ workers are registered here. Add a worker in this folder only if
score/match jobs need to be queued later.
