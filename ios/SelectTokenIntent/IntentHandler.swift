//
//  IntentHandler.swift
//  SelectTokenIntent
//
//  Created by Ben Goldberg on 10/28/21.
//

import Intents

@available(iOS 14.0, *)
class IntentHandler: INExtension, SelectTokenIntentHandling {
  
  func provideTokenOptionsCollection(for intent: SelectTokenIntent, searchTerm: String?, with completion: @escaping (INObjectCollection<Token>?, Error?) -> Void) {
    var topTokenItems = [Token]()
    var otherTokenItems = [Token]()
    let tokenProvider = TokenProvider.shared
    let tokens = tokenProvider.getTokens()
    let topTokens = Constants.topTokenAddresses

    topTokenItems = tokens.topTokens.map { token in
      Token(identifier: token.address!.lowercased(), display: token.name! + " (" + token.symbol! + ")")
    }
    
    if let searchTerm = searchTerm {
      otherTokenItems = tokens.otherTokens.map { token in
        Token(identifier: token.address!.lowercased(), display: token.name! + " (" + token.symbol! + ")")
      }
      
      topTokenItems = topTokenItems.filter {
        $0.displayString.lowercased().contains(searchTerm.lowercased())
      }
      
      otherTokenItems = otherTokenItems.filter {
        $0.displayString.lowercased().contains(searchTerm.lowercased())
      }
    }
  
    topTokenItems.sort(by: {
      topTokens[$0.identifier!]! < topTokens[$1.identifier!]!
    })
    
    if (searchTerm != nil) {
      otherTokenItems.sort(by: {
        $0.displayString < $1.displayString
      })
      
      completion(INObjectCollection(sections: [
        INObjectSection(title: "Top Tokens", items: topTokenItems),
        INObjectSection(title: "More Tokens", items: otherTokenItems)
      ]), nil)
    } else {
      completion(INObjectCollection(sections: [
        INObjectSection(title: "Top Tokens", items: topTokenItems)
      ]), nil)
    }
  }
  
  func provideCurrencyOptionsCollection(for intent: SelectTokenIntent, searchTerm: String?, with completion: @escaping (INObjectCollection<Currency>?, Error?) -> Void) {
    var currencies = [Currency]()
    
    currencies = Constants.currencyDict.values.map { currency in
      Currency(identifier: currency.identifier, display: currency.display)
    }
    
    if let searchTerm = searchTerm {
      currencies = currencies.filter {
        $0.displayString.lowercased().contains(searchTerm.lowercased())
      }
    }
    
    currencies.sort(by: {
      Constants.currencyDict[$0.identifier!]!.rank < Constants.currencyDict[$1.identifier!]!.rank
    })
    
    completion(INObjectCollection(items: currencies), nil)
  }
}
