Feature: Send message feature

  Scenario: Verify if message sent
    Given I have a message to send
    When I send the message
    Then the message should be sent
