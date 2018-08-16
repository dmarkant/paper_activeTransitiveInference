# obtained from:
# http://www.mypolyuweb.hk/~sjpolit/confidenceintervals.html

# This is a function that calculates Cousineau-Morey within-subject CIs.
#	formula: the formula describing what you want to plot, i.e.,
#		DV ~ IV1 + IV2 ....
#	data: the data frame
#	grouping.var: defaults to "Subject". Don't include this in the
#		formula.
#	conf.level: confidence level for the CI. Defaults to .95
#	correct: Correction to apply. Defaults to "Morey" to apply the Morey (2008)
#		bias correction; it will also do this if correct==T. To not do the
#		correction, set it to anything else (e.g. correct=="none" or
#		correct==F)
# The output of the function isn't actually a CI, it's the ranges from the mean.
#	So an actual CI will be the mean +/- what is returned in this function.
#	It returns the output in the table, with variables in the same order as
#	what you get from tapply( DV, IVs, mean), so that is handy.
CMCI <- function( formula, data, grouping.var="Subject", conf.level=.95, correct="Morey" ){
  
  # Figure out the DV and the IVs.
  # This doesn't use all.var() because that strips away functions,
  #	whereas sometimes your formula might be like log(DV) ~
  #	rather than just DV.
  vars <- rownames(attr(terms(formula),"factors"))
  DV <- vars[1]
  IVs <- vars[-1]
  
  data <- aggregate( data[,DV], data[,c(IVs,grouping.var)], mean )
  colnames(data)[ length(colnames(data)) ] <- DV
  
  # Get the means
  means <- tapply( data[,DV], data[,IVs], mean )
  
  ## Get the 95% CIs using the Cousineau-Morey method (Morey, 2008)
  
  # First find the mean for each participant
  ptpmeans <- aggregate( data[,DV], list(data[,grouping.var]), mean )
  colnames(ptpmeans) <- c("Subject", "Mean")
  rownames(ptpmeans) <- ptpmeans$Subject
  
  
  # Scale the data by subtracting the participant mean and adding the grand mean
  data$scaled_DV <- data[,DV] - ptpmeans[as.character(data[,grouping.var]),"Mean"] + mean(data[,DV])
  
  # 
  if( tolower(correct)=="morey" | correct==T ){
    # The number of conditions
    K <- sum( unlist( lapply( IVs, function(x){ length(levels(data[,x]))}) ) )
    
    # the Morey (2008) correction factor	
    correction_factor <- sqrt(K/(K-1))
  } else {
    correction_factor <- 1
  }
  # The number of participants
  N <- length(levels(data[,grouping.var]))
  
  # Get the CIs
  CIs <- tapply( data$scaled_DV, data[,IVs], sd ) / sqrt( N ) * qt(mean(c(conf.level,1)), N-1 ) * correction_factor
  

  ## Done figuring out Cousineau-Morey CIs
  
  return( CIs )
  
  
}

# Calculate the CI lengths
#CI.lengths <- CMCI( RT ~ Boundedness + Quantifier, crit, grouping.var="Subject", correct="Morey", conf.level=.95 )

# Plot error bars using those
#arrows( xvals, means+CI.lengths, xvals, means-CI.lengths, code=3, length=.1, angle=90, lwd=2 )
