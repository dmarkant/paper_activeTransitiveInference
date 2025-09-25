setwd("~/studies/study_active_transitive_inference/analysis/")

ci.acc = confint(model.acc)
ci.acc_endpoint = confint(model.acc_endpoint)
ci.rt = confint(model.rt)


save(ci.acc, ci.acc_endpoint, ci.rt, file = "confints.RData")
