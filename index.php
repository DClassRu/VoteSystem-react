<?php
// Подключение к базе данных
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "voting_system";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

if (isset($_COOKIE['voted'])) {
    $message = "Вы уже проголосовали!";
    $candidatesVisible = false;
} else {
    $message = "";
    $candidatesVisible = true;

    if (isset($_POST['vote'])) {
        $candidateId = $_POST['candidate'];
        $sql = "UPDATE candidates SET votes = votes + 1 WHERE id = $candidateId";
        $conn->query($sql);

        setcookie('voted', true, time() + (60 * 60 * 24));
        $message = "Голос учтен!";
        $candidatesVisible = false;
    }
}

$sql = "SELECT * FROM candidates";
$result = $conn->query($sql);
?>

<?php include 'header.php'; ?>

<?php if ($candidatesVisible): ?>
    <h2 class="text-center">Выберите кандидата:</h2>
    <form method="post" action="" class="text-center">
        <?php while ($row = $result->fetch_assoc()): ?>
            <button type="button" class="btn btn-outline-primary m-3 candidate-button" data-candidate="<?php echo $row['id']; ?>">
                <?php echo $row['name']; ?>
            </button>
        <?php endwhile; ?>
        
        <button type="submit" name="vote" class="btn btn-primary mt-3">Проголосовать</button>
        <input type="hidden" id="selectedCandidate" name="candidate" value="">
    </form>
<?php endif; ?>

<p class="mt-3 <?php echo $message ? 'text-danger' : 'text-success'; ?> text-center"><?php echo $message; ?></p>
<h2 class="mt-5 text-center">Результаты голосования:</h2>
<div class="text-center">
    <?php
    $totalVotes = 0;

    // Получение общего числа голосов
    $totalVotesResult = $conn->query("SELECT SUM(votes) as total_votes FROM candidates");
    $totalVotesRow = $totalVotesResult->fetch_assoc();
    $totalVotes = $totalVotesRow['total_votes'];

    // Вывод результатов
    $result->data_seek(0); // Сброс указателя результата на начало
    while ($row = $result->fetch_assoc()) {
        $votes = $row['votes'];
        $percentage = ($totalVotes > 0) ? round(($votes / $totalVotes) * 100, 2) : 0;
        $widthPercentage = min($percentage * 2, 100); // Ширина прогресс-бара, увеличенная в два раза
    ?>
        <h4><?php echo $row['name']; ?></h4>
        <div class="progress" style="height: 30px;">
            <div class="progress-bar" role="progressbar" style="width: <?php echo $widthPercentage; ?>%; background-color: #5bc0de;" aria-valuenow="<?php echo $percentage; ?>" aria-valuemin="0" aria-valuemax="100">
                <span style="color: black;"><?php echo "{$votes} голосов ({$percentage}%)"; ?></span>
            </div>
        </div>
    <?php } ?>
</div>

<script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.4.0/dist/confetti.browser.min.js"></script>
<script>
    document.addEventListener("DOMContentLoaded", function() {
        var candidateButtons = document.querySelectorAll('.candidate-button');

        candidateButtons.forEach(function(button) {
            button.addEventListener('click', function() {
                var candidateId = this.getAttribute('data-candidate');
                document.getElementById('selectedCandidate').value = candidateId;
            });
        });

        function triggerConfetti() {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }

        // Call the triggerConfetti function if the message indicates a successful vote
        <?php if ($message === "Голос учтен!"): ?>
            triggerConfetti();
        <?php endif; ?>
    });
</script>

<?php include 'footer.php'; ?>

<?php
// Закрываем соединение с базой данных
$conn->close();
?>
