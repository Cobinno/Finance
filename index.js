const express = require("express");
const cors = require("cors");
const CollectionPage = require("./router/collectionpage");
const database = require("./config/database");
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const apiport = 8080;
try {

  app.get('/loan', async (req, res) => {
    try {
      const result = await database.query("select loanAmount-sum(t2.loanpaidamount) as 'balance',t1.loancode, borrowerName,loanAmount,deliverAmount,startDt,endDt,loanType from loan t1 inner join ref_loanpaid t2 on t1.loancode=t2.loancode where t1.IsActive='1' group by  borrowerName,loanAmount,deliverAmount,startDt,endDt,loanType,loanid,t1.loancode order by t1.loanid");
      res.send(result);
     console.log(result);
    } catch (err) {
      console.error(err);
      console.error(err);
      res.status(500).send('Server error');
    }
  });
  
  app.get('/Borrower', async (req, res) => {
    try {
      const result = await database.query("select * from borrower order by borrowerid");
      res.send(result);
    console.log(result);
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  });
  app.post('/AddBorrower', async (req, res) => {
    try {
      const verify = await database.query("Select * from borrower where idproof ='"+req.body.IdProof+"'");
     console.log(verify.length);

      if(verify.length==0){
      const result = await database.query("INSERT INTO borrower (BorrowerName,Area, ReferredBy, IdProof, MobileNumber,  IsActive,CreatedBy, CreatedDate) VALUES ('"+req.body.borrowerName+"','"+req.body.area+"' ,'"+req.body.referredBy+"','"+req.body.IdProof+"', '"+req.body.mobileNumber+"' , '"+req.body.isActive+"',  '"+req.body.createdBy+"', GETDATE())");
      res.send(result);
      }
      else{
        res.send("Already Exist")
      }
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  });
  app.post('/getDate', async (req, res) => {
    try {
      const result = await database.query("SELECT * FROM ref_LoanPaid WHERE loancode = '"+req.body.loancode+"' and CONVERT(date, date, 103) BETWEEN CONVERT(date, (select startDt from loan where loancode='"+req.body.loancode+"'), 103) AND CONVERT(date, (SELECT TOP 1 Date FROM ref_LoanPaid WHERE LoanCode = '"+req.body.loancode+"' AND IsCompleted = 1 ORDER BY loanpaidid DESC), 103) order by loanpaidid desc");
      res.send(result);
  
     console.log(result);
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  });


  app.post('/login', async (req, res) => {
    try {
      const result = await database.query("Select * from login where username='"+req.body.username+"'");
      if (result.length==0){
        res.send("invalid");
        console.log(result);
      }
      else{
        res.send(result);
        console.log(result);

      }
  
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  });

  app.post('/getborrowers', async (req, res) => {
    try {
      const result = await database.query("select * from borrower where area='"+req.body.area+"'");
      if (result.length==0){
        res.send("invalid");
        console.log(result);
      }
      else{
        res.send(result);
        console.log(result);

      }
  
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  });
  
  
  
  app.post('/AddLoan', async (req, res) => {
   // console.log(req.body);
    try {
      const result = await database.query("INSERT INTO Loan (borrowerName,borrowerID, LoanAmount,deliverAmount, StartDt, EndDt, LoanType, Emi, IsActive,CreatedBy, CreatedDate,loancode) VALUES ('"+req.body.borrowerName+"', '"+req.body.borrowerID+"','"+req.body.loanAmount+"','"+req.body.del_amt+"', '"+req.body.startDt+"', '"+req.body.endDt+"', '"+req.body.loanType+"', '"+Math.round(parseInt(req.body.loanAmount)/100)+"', '"+req.body.isActive+"','"+req.body.createdBy+"', GETDATE(),'"+req.body.loanId+"')");
  const std=req.body.startDt.split("-");
  const end=req.body.endDt.split("-");
  getDateRange(`${std[2]}-${std[1]}-${std[0]}`, `${end[2]}-${end[1]}-${end[0]}`);
      for(var i=0;i<dateRange.length;i++){
      const result1 = await database.query("INSERT INTO ref_LoanPaid (Loancode,loanPaidAmount,AgentId,Date,Time,iscompleted) VALUES ('"+req.body.loanId+"',0 ,'','"+dateRange[i]+"','',0)");
    }
      res.send(result);
   //console.log(result);
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  });
  
  app.post('/report', async (req, res) => {
  
    try {
      const result = await database.query("SELECT ROW_NUMBER() OVER (ORDER BY l.borrowerID) AS 'Serial Number',l.borrowerID AS 'Borrower ID', l.borrowername AS Name,b.Area,b.mobilenumber AS 'Mobile Number', l.loanAmount AS 'Amount Allotted', l.deliverAmount As 'Amount Delivered',l.startDt AS 'Allotted Date',l.endDt AS 'Closing Date',(SELECT count(date) FROM ref_LoanPaid t1 inner join loan t2 on t1.loancode=t2.LoanCode WHERE CONVERT(date, date, 103) BETWEEN CONVERT(date,l.startDt, 103) AND CONVERT(date, '"+req.body.today+"' , 103) AND t1.loancode = l.loancode) As 'Days between', l.loanAmount AS 'Amount to be PAID',(SELECT count(date) FROM ref_LoanPaid t1 inner join loan t2 on t1.loancode=t2.LoanCode WHERE CONVERT(date, date, 103) BETWEEN CONVERT(date,l.startDt, 103) AND CONVERT(date, '"+req.body.today+"', 103) AND t1.loancode = l.loancode) * (select emi from loan where loancode=l.loancode)  AS 'Strict Due', SUM(p.LoanPaidAmount) AS 'Amount Paid',(l.loanAmount - SUM(p.LoanPaidAmount)) AS 'Balance',(SELECT t1.LoanPaidAmount FROM ref_LoanPaid t1 right join loan t2 on t1.loancode=t2.loancode WHERE t1.date = '"+req.body.today+"' and t1.LoanCode=l.loancode) AS 'Today' FROM loan AS l INNER JOIN borrower AS b ON l.borrowerid = b.borrowerid INNER JOIN ref_LoanPaid AS p ON l.loancode = p.LoanCode WHERE CONVERT(date, date, 103) BETWEEN CONVERT(date,'05-03-2023', 103) AND CONVERT(date, '"+req.body.today+"', 103) GROUP BY l.borrowerID, l.borrowername, b.Area, b.mobilenumber, l.loanAmount, l.startDt, l.endDt,l.loancode,l.deliverAmount");
      const values = result.map(row => Object.values(row));
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(values));
      console.log(values);
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  });

  app.get('/getareas', async (req, res) => {
  
    try {
     
      const result = await database.query("select area,(select count(borrowerid) where area=area) as 'Count' from borrower group by area");
       res.send(result);
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  });
  
  async function getDateRange(startDate, endDate) {
    const start = new Date(startDate);
    start.setDate(start.getDate()+1);
    const end = new Date(endDate);
    end.setDate(end.getDate());
  dateRange=[];
    for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
      const formattedDate = `${('0' + date.getDate()).slice(-2)}-${('0' + (date.getMonth() + 1)).slice(-2)}-${date.getFullYear()}`;
      dateRange.push(formattedDate);
    }
  }
  
  ///
  
      function gettime(){
        let currentDate = new Date();
        let timeZone = 'Asia/Kolkata';
        let cur_date_time= currentDate.toLocaleTimeString('en-US', { timeZone: timeZone , hour12: true, hour: 'numeric', minute: 'numeric'});
        return cur_date_time
      }
      function getdate() {
        let currentDate = new Date();
        let formattedDate = currentDate.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            timeZone: 'UTC'
        }).replace(/\//g, '-');
        return formattedDate
    }
    app.listen(apiport, () => {
        console.log("Backend server is running" + " " + apiport);
      });
    
    
      app.use("/collection", CollectionPage);
} catch (error) {
    console.log("Throw Error:"+error);
}process.on('uncaughtException', (err, origin) => {
    //code to log the errors
    console.log(
       `Caught exception: ${err}\n` +
       `Exception origin: ${origin}`,
     );
   });


