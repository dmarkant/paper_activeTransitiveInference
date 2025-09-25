
setwd("~/studies/study_active_transitive_inference")


# power
#library(simr)

#m = glmer(correct ~ cond*stim_type + gender + block + (1|sid),  
#          data=data[data$session=='test',], family='binomial',
#          control=glmerControl(optimizer="bobyqa", optCtrl=list(maxfun=2e5)))



suppressMessages(require(lme4))
suppressMessages(library(effects))
#suppressMessages(library(lmerTest))


data = read.csv('data_proc/testdata.csv')

data = data[(!is.na(data$ospan_fta)),]

data$sid = factor(data$sid)
data$gender = factor(data$gender)
data$session = factor(data$session, labels=c('test', 'retest'))
data$cond = factor(data$cond)
data$stim_type = factor(data$stim_type)
data$correct = factor(data$correct)
data$block = factor(data$block)
data$distance = scale(data$distance)
data$distance_bin = scale(data$distance_bin)
data$ospan_fta = scale(data$ospan_fta)
data$sel_med_rt = scale(data$sel_med_rt)





m = glmer(correct ~ 
            cond*session + 
            gender*ospan_fta*cond + 
            distance*cond + 
            gender*cond + block + (1|sid), 
          data=data, family='binomial',
          control=glmerControl(optimizer="bobyqa", optCtrl=list(maxfun=2e5)))
summary(m)
plot(effect("cond:gender:ospan_fta", m))


m = glmer(correct ~ 
            gender*ospan_fta*cond + 
            distance + 
            block + (1|sid), 
          data=data[data$session=='test',], family='binomial',
          control=glmerControl(optimizer="bobyqa", optCtrl=list(maxfun=2e5)))
summary(m)



# selection RT
m = glmer(correct ~ sel_med_rt*cond*session + distance*cond + gender*cond + block + (1|sid), 
          data=data, family='binomial',
          control=glmerControl(optimizer="bobyqa", optCtrl=list(maxfun=2e5)))
summary(m)
plot(effect("sel_med_rt:cond:session", m), rug=T)
plot(effect("cond:gender", m), rug=T)



m = glmer(correct ~ sel_med_rt*cond*session + distance*cond + block + (1|sid), 
          data=data[data$gender=='male',], family='binomial',
          control=glmerControl(optimizer="bobyqa", optCtrl=list(maxfun=2e5)))
summary(m)


m = glmer(correct ~ sel_med_rt*cond*session + distance*cond + block + (1|sid), 
          data=data[data$gender=='female',], family='binomial',
          control=glmerControl(optimizer="bobyqa", optCtrl=list(maxfun=2e5)))
summary(m)





m1 = glmer(correct ~ ospan_fta*cond + block + cond*session + (1|sid),  
          data=data, family='binomial',
          control=glmerControl(optimizer="bobyqa", optCtrl=list(maxfun=2e5)))
summary(m1)


m2 = glmer(correct ~ ospan_fta*cond*session + distance_bin + block + (1|sid),  
           data=data, family='binomial',
           control=glmerControl(optimizer="bobyqa", optCtrl=list(maxfun=2e5)))
summary(m2)



m2 = glmer(correct ~ ospan_fta + cond + block + cond*session + (1|sid),  
           data=data, family='binomial',
           control=glmerControl(optimizer="bobyqa", optCtrl=list(maxfun=2e5)))

summary(m2)


m2 = glmer(correct ~ ospan_fta*cond + distance + block + cond*session + (1|sid),  
           data=data[data$endpoint=='False',], family='binomial',
           control=glmerControl(optimizer="bobyqa", optCtrl=list(maxfun=2e5)))
summary(m2)



m = glmer(correct ~ cond*gender + gender*stim_type + ospan_fta*cond + block + cond*session + (1|sid),  
          data=data, family='binomial',
          control=glmerControl(optimizer="bobyqa", optCtrl=list(maxfun=2e5)))

summary(m)

os_data = data[(!is.na(data$ospan_fta)),]
m = glmer(correct ~ cond*gender + stim_type + ospan_fta*cond + block + cond*session + (1|sid),  
          data=os_data, family='binomial',
          control=glmerControl(optimizer="bobyqa", optCtrl=list(maxfun=2e5)))
summary(m)


#os_data = data[(!is.na(data$ospan_fta)) & (data$session=='test'),]
#m = glmer(correct ~ cond*gender + ospan_fta + gender*stim_type + block + (1|sid),  
#          data=os_data, family='binomial',
#          control=glmerControl(optimizer="bobyqa", optCtrl=list(maxfun=2e5)))
#summary(m)



m = glmer(correct ~ cond*gender + gender*stim_type + block + (1|sid),  
          data=data[data$session=='test',], family='binomial',
          control=glmerControl(optimizer="bobyqa", optCtrl=list(maxfun=2e5)))
summary(m)


m = glmer(correct ~ cond*gender + gender*stim_type + ospan_fta + block + (1|sid),  
          data=data[data$session=='test',], family='binomial',
          control=glmerControl(optimizer="bobyqa", optCtrl=list(maxfun=2e5)))
summary(m)


m = glmer(correct ~ cond*gender + gender*stim_type + block + (1|sid),  
          data=data[data$session=='retest',], family='binomial',
          control=glmerControl(optimizer="bobyqa", optCtrl=list(maxfun=2e5)))
summary(m)


m = glmer(correct ~ cond*gender*stim_type*distance + block + (1|sid),  
          data=data[data$session=='retest',], family='binomial',
          control=glmerControl(optimizer="bobyqa", optCtrl=list(maxfun=2e5)))
summary(m)


# recode into same/different gender
data$stim_match = ((data$gender=='male') & (data$stim_type=='men')) | 
  ((data$gender=='female') & (data$stim_type=='women'))


m = glmer(correct ~ cond*gender*stim_match*distance + cond*session + (1|sid),  
          data=data, family='binomial',
          control=glmerControl(optimizer="bobyqa", optCtrl=list(maxfun=2e5)))
summary(m)

m = glmer(correct ~ stim_type + cond*gender*stim_match*distance + (1|sid),  
          data=data[data$session=='test',], family='binomial',
          control=glmerControl(optimizer="bobyqa", optCtrl=list(maxfun=2e5)))
summary(m)

m = glmer(correct ~ cond*gender*stim_match*distance + (1|sid),  
          data=data[data$session=='retest',], family='binomial',
          control=glmerControl(optimizer="bobyqa", optCtrl=list(maxfun=2e5)))
summary(m)
