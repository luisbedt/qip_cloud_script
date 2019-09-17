
// This is a helper function that verifies that the player's move wasn't made
// too quickly following their previous move, according to the rules of the game.
// If the move is valid, then it updates the player's statistics and profile data.
// This function is called from the "UpdatePlayerMove" handler above and also is
// triggered by the "RoomEventRaised" Photon room event in the Webhook handler
// below.
//
// For this example, the script defines the cooldown period (playerMoveCooldownInSeconds)
// as 15 seconds. A recommended approach for values like this would be to create them in Title
// Data, so that they can be queries in the script with a call to GetTitleData
// (https://api.playfab.com/Documentation/Server/method/GetTitleData). This would allow you to
// make adjustments to these values over time, without having to edit, test, and roll out an
// updated script.
function processPlayerMove(playerMove) {
    var now = Date.now();
    var playerMoveCooldownInSeconds = 15;

    var playerData = server.GetUserInternalData({
        PlayFabId: currentPlayerId,
        Keys: ["last_move_timestamp"]
    });

    var lastMoveTimestampSetting = playerData.Data["last_move_timestamp"];

    if (lastMoveTimestampSetting) {
        var lastMoveTime = Date.parse(lastMoveTimestampSetting.Value);
        var timeSinceLastMoveInSeconds = (now - lastMoveTime) / 1000;
        log.debug("lastMoveTime: " + lastMoveTime + " now: " + now + " timeSinceLastMoveInSeconds: " + timeSinceLastMoveInSeconds);

        if (timeSinceLastMoveInSeconds < playerMoveCooldownInSeconds) {
            log.error("Invalid move - time since last move: " + timeSinceLastMoveInSeconds + "s less than minimum of " + playerMoveCooldownInSeconds + "s.");
            return false;
        }
    }

    var playerStats = server.GetPlayerStatistics({
        PlayFabId: currentPlayerId
    }).Statistics;
    var movesMade = 0;
    for (var i = 0; i < playerStats.length; i++)
        if (playerStats[i].StatisticName === "")
            movesMade = playerStats[i].Value;
    movesMade += 1;
    var request = {
        PlayFabId: currentPlayerId, Statistics: [{
                StatisticName: "movesMade",
                Value: movesMade
            }]
    };
    server.UpdatePlayerStatistics(request);
    server.UpdateUserInternalData({
        PlayFabId: currentPlayerId,
        Data: {
            last_move_timestamp: new Date(now).toUTCString(),
            last_move: JSON.stringify(playerMove)
        }
    });

    return true;
}
