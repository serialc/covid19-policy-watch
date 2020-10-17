
library(rjson)

# get data and structure it

inf <- read.table('https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv', header = T, sep=',', quote = "\"", stringsAsFactors = F)
dth <- read.table('https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv', header=T, sep=',', quote="\"", stringsAsFactors = F)
#rec <- read.table('https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv', header=T, sep=',', quote="\"", stringsAsFactors = F)

eu_countries <- c("Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czechia", "Denmark", "Estonia", "Finland", "France",
                  "Germany", "Greece", "Hungary", "Ireland", "Italy", "Latvia", "Lithuania", "Luxembourg", "Malta", "Netherlands",
                  "Norway",  "Poland", "Portugal", "Romania", "Slovakia", "Slovenia", "Spain", "Sweden", "United Kingdom")

# only want countries in EU
euinf <- inf[inf$Country.Region %in% eu_countries,]
eudth <- dth[dth$Country.Region %in% eu_countries,]

# check for errors, missing data (want TRUE)
all(sort(unique(euinf$Country.Region)) == eu_countries)
all(sort(unique(eudth$Country.Region)) == eu_countries)

# add EU total
euinfplus <- rbind(euinf, c('','EU', 0, 0, colSums(euinf[5:ncol(euinf)])))
eudthplus <- rbind(eudth, c('','EU', 0, 0, colSums(eudth[5:ncol(eudth)])))

# collapse/sum by country
compress_plus <- function(data_list) {
 return(
   lapply(data_list, function(x) {
      #x <- split(euinfplus, euinfplus$Country.Region)[[1]]
      xint <- matrix(sapply(x[,5:ncol(x)], as.integer), nrow = nrow(x))
      colnames(xint) <- colnames(x[5:ncol(x)])
      y <- colSums(xint)
      dt <- as.Date(x = names(y), format="X%m.%d.%j")
      dy <- c(0, diff(y))
      #data.frame(date=strftime(dt, "%F"), sum=y, daily=dy, smth7=round(filter(dy, filter=rep(1/7, 7), sides=1)), row.names = NULL)[7:(length(dy)-0),]
      data.frame(date=strftime(dt, "%F"), sum=y, daily=dy, smth7=round(filter(dy, filter=rep(1/7, 7), sides=2),1), row.names = NULL)
    })
  )
}

euinfcon <- compress_plus(split(euinfplus, euinfplus$Country.Region))
eudthcon <- compress_plus(split(eudthplus, eudthplus$Country.Region))

euinfcon <- lapply(split(euinfplus, euinfplus$Country.Region), function(x) {
  #x <- split(euinfplus, euinfplus$Country.Region)[[1]]
  xint <- matrix(sapply(x[,5:ncol(x)], as.integer), nrow = nrow(x))
  colnames(xint) <- colnames(x[5:ncol(x)])
  y <- colSums(xint)
  dt <- as.Date(x = names(y), format="X%m.%d.%j")
  dy <- c(0, diff(y))
  #data.frame(date=strftime(dt, "%F"), sum=y, daily=dy, smth7=round(filter(dy, filter=rep(1/7, 7), sides=1)), row.names = NULL)[7:(length(dy)-0),]
  data.frame(date=strftime(dt, "%F"), sum=y, daily=dy, smth7=round(filter(dy, filter=rep(1/7, 7), sides=2),1), row.names = NULL)
  })
eudthcon <- lapply(split(eudthplus, eudth$Country.Region), function(x) {
  #x <- split(eudth, eudth$Country.Region)[[1]]
  xint <- matrix(sapply(x[,5:ncol(x)], as.integer), nrow = nrow(x))
  colnames(xint) <- colnames(x[5:ncol(x)])
  y <- colSums(x[,5:ncol(x)])
  dt <- as.Date(x = names(y), format="X%m.%d.%j")
  dy <- c(0, diff(y))
  #data.frame(date=strftime(dt, "%F"), sum=y, daily=dy, smth7=round(filter(dy, filter=rep(1/7, 7), sides=1)), row.names = NULL)[7:(length(dy)-0),]
  data.frame(date=strftime(dt, "%F"), sum=y, daily=dy, smth7=round(filter(dy, filter=rep(1/7, 7), sides=2),1), row.names = NULL)
})

full <- list(inf=euinfcon, dth=eudthcon)
     
write(toJSON(full), file = 'www/data/covid19_infdth.json')

