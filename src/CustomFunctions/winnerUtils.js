export const getWinnerDetails = async (matchId) => {
    try {
        // Fetch match details
        const matchResponse = await fetch(`https://fantasymmadness-game-server-three.vercel.app/api/matches/${matchId}`);
        const match = await matchResponse.json();
        
        const scoresResponse = await fetch('https://fantasymmadness-game-server-three.vercel.app/api/scores');
        const scoresData = await scoresResponse.json();

        // Fetch all users
        const usersResponse = await fetch('https://fantasymmadness-game-server-three.vercel.app/users');
        const usersData = await usersResponse.json();
        
        const scoresHigh = scoresData.filter(score => score.matchId === matchId);
        
        let highestScorer = null;
        let highestPoints = 0;

        scoresHigh.forEach((score) => {
            const user = usersData.find(u => u._id === score.playerId);
            if (!user) return;

            const fighterOneStats = match.matchCategory === 'boxing' ? match.BoxingMatch.fighterOneStats : match.MMAMatch.fighterOneStats;
            const fighterTwoStats = match.matchCategory === 'boxing' ? match.BoxingMatch.fighterTwoStats : match.MMAMatch.fighterTwoStats;
            const totalPoints = calculatePoints(score.predictions, fighterOneStats, fighterTwoStats, match.matchCategory);

            if (totalPoints > highestPoints) {
                highestPoints = totalPoints;
                highestScorer = user;
            }
        });

        if (highestScorer) {
            return {
                firstName: highestScorer.firstName,
                lastName: highestScorer.lastName,
                profileUrl: highestScorer.profileUrl,
                totalPoints: highestPoints,
                matchId: matchId,
                userId: highestScorer._id
            };
        }

        return null;
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
};

const calculatePoints = (userPrediction, fighterOneStats, fighterTwoStats, matchCategory) => {
    let totalScore = 0;

    userPrediction.forEach((roundPrediction, index) => {
        const fighterOneRound = fighterOneStats[index];
        const fighterTwoRound = fighterTwoStats[index];

        if (!fighterOneRound || !fighterTwoRound || !roundPrediction) return;

        // For Boxing
        if (matchCategory === 'boxing') {
            // Head Punches (HP) - Fighter One
            if (roundPrediction.hpPrediction1 !== null && roundPrediction.hpPrediction1 <= fighterOneRound.HP) {
                totalScore += roundPrediction.hpPrediction1;
            }

            // Body Punches (BP) - Fighter One
            if (roundPrediction.bpPrediction1 !== null && roundPrediction.bpPrediction1 <= fighterOneRound.BP) {
                totalScore += roundPrediction.bpPrediction1;
            }

            // Total Punches (TP) - Fighter One
            if (roundPrediction.tpPrediction1 !== null && roundPrediction.tpPrediction1 <= fighterOneRound.TP) {
                totalScore += roundPrediction.tpPrediction1;
            }

            // Picking Round Winner (RW) - Fighter One
            if (roundPrediction.rwPrediction1 !== null && roundPrediction.rwPrediction1 === fighterOneRound.RW) {
                totalScore += roundPrediction.rwPrediction1;
            }

            // Knock Out (KO) - Fighter One
            if (roundPrediction.koPrediction1 !== null && roundPrediction.koPrediction1 === fighterOneRound.KO) {
                totalScore += fighterOneRound.KO;
            }

            // Fighter Two Stats
            if (roundPrediction.hpPrediction2 !== null && roundPrediction.hpPrediction2 <= fighterTwoRound.HP) {
                totalScore += roundPrediction.hpPrediction2;
            }
            if (roundPrediction.bpPrediction2 !== null && roundPrediction.bpPrediction2 <= fighterTwoRound.BP) {
                totalScore += roundPrediction.bpPrediction2;
            }
            if (roundPrediction.tpPrediction2 !== null && roundPrediction.tpPrediction2 <= fighterTwoRound.TP) {
                totalScore += roundPrediction.tpPrediction2;
            }
            if (roundPrediction.rwPrediction2 !== null && roundPrediction.rwPrediction2 === fighterTwoRound.RW) {
                totalScore += roundPrediction.rwPrediction2;
            }
            if (roundPrediction.koPrediction2 !== null && roundPrediction.koPrediction2 === fighterTwoRound.KO) {
                totalScore += fighterTwoRound.KO;
            }
        }

        // For MMA
        else if (matchCategory === 'mma') {
            // Strikes (ST) - Fighter One
            if (roundPrediction.hpPrediction1 !== null && roundPrediction.hpPrediction1 <= fighterOneRound.ST) {
                totalScore += roundPrediction.hpPrediction1;
            }

            // Kicks (KI) - Fighter One
            if (roundPrediction.bpPrediction1 !== null && roundPrediction.bpPrediction1 <= fighterOneRound.KI) {
                totalScore += roundPrediction.bpPrediction1;
            }

            // Knockdowns (KN) - Fighter One
            if (roundPrediction.tpPrediction1 !== null && roundPrediction.tpPrediction1 <= fighterOneRound.KN) {
                totalScore += roundPrediction.tpPrediction1;
            }

            // Elbows (EL) - Fighter One
            if (roundPrediction.elPrediction1 !== null && roundPrediction.elPrediction1 <= fighterOneRound.EL) {
                totalScore += roundPrediction.elPrediction1;
            }

            // Picking Round Winner (RW) - Fighter One
            if (roundPrediction.rwPrediction1 !== null && roundPrediction.rwPrediction1 === fighterOneRound.RW) {
                totalScore += roundPrediction.rwPrediction1;
            }

            // Knock Out (KO) - Fighter One
            if (roundPrediction.koPrediction1 !== null && roundPrediction.koPrediction1 === fighterOneRound.KO) {
                totalScore += fighterOneRound.KO;
            }

            // Fighter Two Stats
            if (roundPrediction.hpPrediction2 !== null && roundPrediction.hpPrediction2 <= fighterTwoRound.ST) {
                totalScore += roundPrediction.hpPrediction2;
            }
            if (roundPrediction.bpPrediction2 !== null && roundPrediction.bpPrediction2 <= fighterTwoRound.KI) {
                totalScore += roundPrediction.bpPrediction2;
            }
            if (roundPrediction.tpPrediction2 !== null && roundPrediction.tpPrediction2 <= fighterTwoRound.KN) {
                totalScore += roundPrediction.tpPrediction2;
            }
            if (roundPrediction.elPrediction2 !== null && roundPrediction.elPrediction2 <= fighterTwoRound.EL) {
                totalScore += roundPrediction.elPrediction2;
            }
            if (roundPrediction.rwPrediction2 !== null && roundPrediction.rwPrediction2 === fighterTwoRound.RW) {
                totalScore += roundPrediction.rwPrediction2;
            }
            if (roundPrediction.koPrediction2 !== null && roundPrediction.koPrediction2 === fighterTwoRound.KO) {
                totalScore += fighterTwoRound.KO;
            }
        }
    });

    return totalScore;
};
